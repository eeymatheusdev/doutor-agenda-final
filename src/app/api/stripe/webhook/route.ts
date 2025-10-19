// src/app/api/stripe/webhook/route.ts
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe secret key or webhook secret not found");
    return NextResponse.json(
      { error: "Stripe configuration error" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("Stripe signature not found");
    return NextResponse.json(
      { error: "Stripe signature missing" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });

  try {
    const text = await request.text();
    event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer;

        // Find the subscription ID or object from the invoice lines
        const subscriptionLineItem = invoice.lines.data.find(
          (item) => !!item.subscription,
        );
        const subscriptionInfo = subscriptionLineItem?.subscription; // Can be string | Stripe.Subscription | null | undefined

        let subscriptionId: string | undefined;
        let subscriptionObject: Stripe.Subscription | undefined;

        // CORREÇÃO: Handle both string ID and expanded object
        if (typeof subscriptionInfo === "string") {
          subscriptionId = subscriptionInfo;
        } else if (subscriptionInfo && typeof subscriptionInfo === "object") {
          subscriptionId = subscriptionInfo.id;
          subscriptionObject = subscriptionInfo; // Store the object if already fetched
        }

        // If no subscription ID could be determined, stop processing
        if (!subscriptionId) {
          console.log(
            "Invoice paid event does not have a valid subscription line item.",
          );
          break;
        }

        // Ensure customerId is a string
        if (typeof customerId !== "string") {
          console.error("Customer ID on invoice is not a string.", {
            invoiceId: invoice.id,
          });
          break;
        }

        // Retrieve the subscription object *only if* we didn't get it from the line item
        const subscription =
          subscriptionObject ??
          (await stripe.subscriptions.retrieve(subscriptionId)); // Now definitely uses a string ID

        const userId = subscription.metadata.userId;
        const planType = subscription.metadata.planType as
          | "monthly"
          | "semiannual"
          | "annual"
          | null;

        if (!userId || !planType) {
          console.error(
            "Missing userId or planType in subscription metadata for invoice.paid",
            { subscriptionId },
          );
          break;
        }

        console.log(
          `Updating user ${userId} with plan ${planType} and subscription ${subscriptionId}`,
        );
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            plan: planType,
          })
          .where(eq(usersTable.id, userId));
        console.log(`User ${userId} updated successfully.`);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error(
            "Missing userId in metadata for customer.subscription.deleted",
            { subscriptionId: subscription.id },
          );
          break;
        }

        console.log(
          `Subscription ${subscription.id} deleted for user ${userId}. Clearing plan data.`,
        );
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: null,
            plan: null,
          })
          .where(eq(usersTable.id, userId));
        console.log(`User ${userId} plan data cleared.`);
        break;
      }
    }
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
};
