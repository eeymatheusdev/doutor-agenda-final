// src/app/api/stripe/webhook/route.ts
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
// Remove redirect import if not used elsewhere in the file
// import { redirect } from "next/navigation";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe keys not configured.");
    return NextResponse.json(
      { error: "Stripe configuration error" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("Stripe signature missing.");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil", // Use a versão desejada
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`⚠️ Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // Handle the event
  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice; // Type assertion
      const customerId = invoice.customer;

      let subscriptionId: string | null = null;

      // Primary way: Get subscription ID from the first line item that has it
      if (invoice.lines?.data?.length > 0) {
        const subscriptionLineItem = invoice.lines.data.find(
          (item) => item.subscription,
        );

        if (subscriptionLineItem?.subscription) {
          if (typeof subscriptionLineItem.subscription === "string") {
            subscriptionId = subscriptionLineItem.subscription;
          } else if (
            typeof subscriptionLineItem.subscription === "object" &&
            subscriptionLineItem.subscription.id
          ) {
            subscriptionId = subscriptionLineItem.subscription.id;
          }
        }
      }

      // Fallback: If not found in line items, check if the invoice object itself has it (less common now but good for safety)
      // This requires casting invoice to any to bypass the strict type check, acknowledging potential API variations.
      if (!subscriptionId && (invoice as any).subscription) {
        const sub = (invoice as any).subscription;
        if (typeof sub === "string") {
          subscriptionId = sub;
        } else if (typeof sub === "object" && sub.id) {
          subscriptionId = sub.id;
        }
      }

      // --- Fetch Subscription to get metadata ---
      let metadata: { userId?: string; planType?: string } | null = null;
      if (typeof subscriptionId === "string") {
        try {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          metadata = subscription.metadata;
        } catch (subError) {
          console.error(
            `Webhook invoice.paid: Failed to retrieve subscription ${subscriptionId}`,
            subError,
          );
          break; // Stop processing if subscription can't be fetched
        }
      }
      // --- End Fetch Subscription ---

      if (
        typeof customerId !== "string" ||
        !subscriptionId ||
        !metadata?.userId ||
        !metadata?.planType
      ) {
        console.error("Webhook invoice.paid: Missing required data.", {
          customerId,
          subscriptionId,
          metadata,
        });
        break; // Sai do switch se dados essenciais faltarem
      }

      try {
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            plan: metadata.planType,
          })
          .where(eq(usersTable.id, metadata.userId));
        console.log(
          `Updated user ${metadata.userId} with plan ${metadata.planType}`,
        );
      } catch (dbError) {
        console.error(
          `Webhook invoice.paid: DB update failed for user ${metadata.userId}`,
          dbError,
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription; // Type assertion
      const userId = subscription.metadata?.userId;

      if (!userId) {
        const customerId = subscription.customer;
        if (typeof customerId === "string") {
          console.warn(
            `Webhook customer.subscription.deleted: userId missing in metadata for subscription ${subscription.id}. Attempting lookup by customerId ${customerId}.`,
          );
          try {
            const user = await db.query.usersTable.findFirst({
              where: eq(usersTable.stripeCustomerId, customerId),
            });
            if (user) {
              await db
                .update(usersTable)
                .set({
                  stripeSubscriptionId: null,
                  plan: null,
                })
                .where(eq(usersTable.id, user.id));
              console.log(
                `Updated user ${user.id} (found via customerId) - subscription cancelled.`,
              );
            } else {
              console.error(
                `Webhook customer.subscription.deleted: Could not find user with customerId ${customerId}.`,
              );
            }
          } catch (dbError) {
            console.error(
              `Webhook customer.subscription.deleted: DB update failed for customer ${customerId}`,
              dbError,
            );
          }
        } else {
          console.error(
            `Webhook customer.subscription.deleted: Missing userId in metadata and invalid customerId for subscription ${subscription.id}.`,
          );
        }
        break; // Sai do switch
      }

      // Se userId existe nos metadados (fluxo normal)
      try {
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: null,
            plan: null,
          })
          .where(eq(usersTable.id, userId));
        console.log(`Updated user ${userId} - subscription cancelled.`);
      } catch (dbError) {
        console.error(
          `Webhook customer.subscription.deleted: DB update failed for user ${userId}`,
          dbError,
        );
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription; // Type assertion
      if (
        subscription.cancel_at_period_end === false &&
        subscription.status === "active"
      ) {
        // Subscription was reactivated
        const userId = subscription.metadata?.userId;
        const planType = subscription.metadata?.planType;

        if (userId && planType) {
          try {
            await db
              .update(usersTable)
              .set({
                plan: planType,
                stripeSubscriptionId: subscription.id, // Ensure subscription ID is also updated/confirmed
              })
              .where(eq(usersTable.id, userId));
            console.log(
              `User ${userId} reactivated subscription ${subscription.id} to plan ${planType}.`,
            );
          } catch (dbError) {
            console.error(
              `Webhook customer.subscription.updated: DB update failed for user ${userId} on reactivation`,
              dbError,
            );
          }
        } else {
          console.warn(
            `Webhook customer.subscription.updated: Missing userId or planType in metadata for reactivated subscription ${subscription.id}.`,
          );
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
};
