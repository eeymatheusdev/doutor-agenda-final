// src/actions/create-stripe-portal-session/index.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";

import { auth, CustomSession } from "@/lib/auth"; // Import CustomSession type
import { actionClient } from "@/lib/next-safe-action";

export const createStripePortalSession = actionClient.action(async () => {
  // Use the specific CustomSession type for better type checking
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as CustomSession | null; // Cast to CustomSession or null

  // Verifica se o usuário está logado e possui um stripeCustomerId
  if (!session?.user?.id || !session.user.stripeCustomerId) {
    throw new Error(
      "Usuário não autorizado ou ID de cliente Stripe não encontrado.",
    );
  }

  // Verifica se a chave secreta do Stripe está configurada
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Chave secreta do Stripe não configurada.");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil", // Use a versão da API do Stripe
  });

  const customerId = session.user.stripeCustomerId;

  // Define a URL de retorno após o usuário interagir com o portal
  // Redireciona para a página de nova assinatura após o cancelamento
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/new-subscription`;

  // Cria a sessão do Portal de Faturamento
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  // Retorna a URL do portal para redirecionamento no cliente
  return { portalUrl: portalSession.url };
});
