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
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`Processing invoice.paid event: ${invoice.id}`); // Log invoice ID

      // --- CORREÇÃO: Usar 'as any' para acessar 'invoice.subscription' ---
      let customerId: string | null = null;
      if (typeof invoice.customer === "string") {
        customerId = invoice.customer;
      } else if (typeof invoice.customer === "object" && invoice.customer?.id) {
        customerId = invoice.customer.id;
      }

      let subscriptionId: string | null = null;
      // Use 'as any' to bypass strict type checking for invoice.subscription
      const invoiceSubscription = (invoice as any).subscription;
      if (typeof invoiceSubscription === "string") {
        subscriptionId = invoiceSubscription;
      } else if (
        typeof invoiceSubscription === "object" &&
        invoiceSubscription?.id
      ) {
        subscriptionId = invoiceSubscription.id;
      }
      // --- FIM DA CORREÇÃO ---

      // Fallback: Tentar pegar dos line items (menos comum para novas assinaturas)
      if (!subscriptionId && invoice.lines?.data?.length > 0) {
        console.log("Attempting to find subscriptionId in line items...");
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

      // Log IDs encontrados
      console.log(`Customer ID found: ${customerId}`);
      console.log(`Subscription ID found: ${subscriptionId}`);

      // --- Fetch Subscription to get metadata ---
      let metadata: { userId?: string; planType?: string } | null = null;
      if (typeof subscriptionId === "string") {
        try {
          console.log(`Fetching subscription object: ${subscriptionId}`);
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          metadata = subscription.metadata;
          console.log("Subscription metadata:", metadata);
        } catch (subError) {
          console.error(
            `Webhook invoice.paid: Failed to retrieve subscription ${subscriptionId}`,
            subError,
          );
          // Não quebrar o fluxo inteiro se a busca da assinatura falhar,
          // mas logar o erro e continuar sem metadata.
          metadata = null; // Garante que metadata é null se a busca falhar
        }
      } else {
        console.warn(
          `Webhook invoice.paid: subscriptionId not found or not a string for invoice ${invoice.id}. Cannot fetch metadata.`,
        );
      }
      // --- End Fetch Subscription ---

      const userId = metadata?.userId;
      const planType = metadata?.planType;

      if (!customerId || !subscriptionId || !userId || !planType) {
        console.error("Webhook invoice.paid: Missing required data.", {
          invoiceId: invoice.id,
          customerId: customerId ?? "missing",
          subscriptionId: subscriptionId ?? "missing",
          metadataUserId: userId ?? "missing",
          metadataPlanType: planType ?? "missing",
        });
        break; // Sai do switch se dados essenciais faltarem
      }

      try {
        console.log(`Updating user ${userId} with plan ${planType}`);
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            plan: planType, // Usa o planType dos metadados
          })
          .where(eq(usersTable.id, userId));
        console.log(
          `Successfully updated user ${userId} with plan ${planType}, subscription ${subscriptionId}, customer ${customerId}`,
        );
      } catch (dbError) {
        console.error(
          `Webhook invoice.paid: DB update failed for user ${userId}`,
          dbError,
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      console.log(
        `Processing customer.subscription.deleted event for subscription: ${subscription.id}, User ID from metadata: ${userId}`,
      );

      if (!userId) {
        const customerId = subscription.customer;
        if (typeof customerId === "string") {
          console.warn(
            `Webhook customer.subscription.deleted: userId missing in metadata for subscription ${subscription.id}. Attempting lookup by customerId ${customerId}.`,
          );
          try {
            const user = await db.query.usersTable.findFirst({
              where: eq(usersTable.stripeCustomerId, customerId),
              columns: { id: true }, // Buscar apenas o ID
            });
            if (user) {
              await db
                .update(usersTable)
                .set({
                  stripeSubscriptionId: null,
                  plan: null, // Limpa o plano também
                })
                .where(eq(usersTable.id, user.id));
              console.log(
                `Updated user ${user.id} (found via customerId ${customerId}) - subscription cancelled.`,
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
            plan: null, // Limpa o plano também
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
      const subscription = event.data.object as Stripe.Subscription;
      console.log(
        `Processing customer.subscription.updated event for subscription: ${subscription.id}`,
      );
      // Exemplo: Reativação ou mudança de plano (pode precisar de mais lógica)
      if (
        subscription.cancel_at_period_end === false &&
        subscription.status === "active"
      ) {
        // Subscription was reactivated or potentially changed
        const userId = subscription.metadata?.userId;
        // Assume que o planType está nos metadados da assinatura (pode não estar se for só reativação)
        // Se a mudança de plano ocorrer, o evento 'invoice.paid' pode ser mais confiável para pegar o novo planType
        const planType = subscription.metadata?.planType;

        console.log(
          `Subscription ${subscription.id} updated. Status: ${subscription.status}, Cancel at period end: ${subscription.cancel_at_period_end}. Metadata:`,
          subscription.metadata,
        );

        if (userId && planType) {
          try {
            await db
              .update(usersTable)
              .set({
                plan: planType, // Atualiza o plano
                stripeSubscriptionId: subscription.id, // Garante que o ID da assinatura está correto
              })
              .where(eq(usersTable.id, userId));
            console.log(
              `User ${userId} updated/reactivated subscription ${subscription.id} to plan ${planType}.`,
            );
          } catch (dbError) {
            console.error(
              `Webhook customer.subscription.updated: DB update failed for user ${userId} on update/reactivation`,
              dbError,
            );
          }
        } else {
          console.warn(
            `Webhook customer.subscription.updated: Missing userId or planType in metadata for updated subscription ${subscription.id}. Plan update might need to rely on invoice.paid.`,
          );
        }
      } else if (subscription.status === "canceled") {
        // Tratamento adicional se a assinatura for cancelada imediatamente (não apenas no fim do período)
        const userId = subscription.metadata?.userId;
        if (userId) {
          try {
            await db
              .update(usersTable)
              .set({
                stripeSubscriptionId: null,
                plan: null,
              })
              .where(eq(usersTable.id, userId));
            console.log(`User ${userId} - subscription immediately cancelled.`);
          } catch (dbError) {
            console.error(
              `Webhook customer.subscription.updated (immediate cancel): DB update failed for user ${userId}`,
              dbError,
            );
          }
        } else {
          console.warn(
            `Webhook customer.subscription.updated (immediate cancel): Missing userId in metadata for subscription ${subscription.id}.`,
          );
        }
      }
      break;
    }

    // Adicione outros casos de evento conforme necessário (ex: checkout.session.completed se precisar de ação imediata)
    // case 'checkout.session.completed': {
    //   const session = event.data.object as Stripe.Checkout.Session;
    //   // Note: 'invoice.paid' é geralmente o evento mais confiável para confirmar o pagamento
    //   // Mas você pode realizar ações preliminares aqui se necessário.
    //   console.log(`Checkout session completed: ${session.id}`);
    //   break;
    // }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
};
