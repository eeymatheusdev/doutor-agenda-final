// src/actions/create-stripe-portal-session/index.ts
"use server";

import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod"; // Import Zod

import { auth, CustomSession } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

// Schema de input (vazio, pois não esperamos input)
const inputSchema = z.undefined();

// Usa actionClient com validação de schema (apenas para input neste caso)
export const createStripePortalSession = actionClient
  .schema(inputSchema) // Define explicitamente que não há schema de input
  .action(async () => {
    // Remove o parâmetro de input, pois é undefined
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as CustomSession | null;

    // Verifica se o usuário está logado
    if (!session?.user?.id) {
      console.error("[Stripe Portal] User not authorized."); // Log de erro no servidor
      throw new Error("Usuário não autorizado.");
    }

    // Verifica se a chave secreta do Stripe está configurada
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Stripe Portal] Stripe secret key not configured."); // Log de erro no servidor
      throw new Error("Chave secreta do Stripe não configurada.");
    }

    const customerId = session.user.stripeCustomerId; // ID do cliente Stripe

    if (!customerId) {
      console.error(
        "[Stripe Portal] Stripe customer ID not found in session for user:",
        session.user.id,
      ); // Log de erro no servidor
      throw new Error(
        "ID de cliente Stripe não encontrado na sessão do usuário.",
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });

    // Define a URL de retorno
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/new-subscription`;

    try {
      console.log(
        `[Stripe Portal] Creating portal session for customer: ${customerId} with return URL: ${returnUrl}`,
      ); // Log de tentativa
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      console.log(
        `[Stripe Portal] Session created successfully: ${portalSession.id}`,
      ); // Log de sucesso
      // Retorna o objeto esperado pelo hook useAction
      return { portalUrl: portalSession.url };
    } catch (stripeError: any) {
      console.error(
        "[Stripe Portal] Stripe Billing Portal Session creation failed:",
        stripeError,
      ); // Log detalhado do erro Stripe
      // Lança um erro que será capturado pelo next-safe-action
      throw new Error(
        `Falha ao criar a sessão do portal Stripe: ${stripeError.message || "Erro desconhecido"}`,
      );
    }
  });
