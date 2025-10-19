// src/app/new-subscription/page.tsx

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { SubscriptionPlanCard } from "../(protected)/subscription/_components/subscription-plan-card";

const plans = [
  {
    title: "Plano Mensal",
    description: "Ideal para começar.",
    price: 249.9,
    interval: "mensalmente",
    priceId: process.env.STRIPE_MONTHLY_PLAN_PRICE_ID!,
    planType: "monthly" as const,
  },
  {
    title: "Plano Semestral",
    description: "Economize com o plano de 6 meses.",
    price: 1449.9,
    interval: "semestralmente",
    priceId: process.env.STRIPE_SEMIANNUAL_PLAN_PRICE_ID!,
    planType: "semiannual" as const,
  },
  {
    title: "Plano Anual",
    description: "O melhor custo-benefício.",
    price: 2799.9,
    interval: "anualmente",
    priceId: process.env.STRIPE_ANNUAL_PLAN_PRICE_ID!,
    planType: "annual" as const,
  },
];

export default async function NewSubscriptionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/authentication");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="mb-8 w-full max-w-4xl text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Desbloqueie todo o potencial da sua clínica
        </h1>
        <p className="mb-6 text-xl text-gray-600">
          Escolha o plano que melhor se adapta às suas necessidades e comece a
          transformar a gestão do seu consultório.
        </p>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <SubscriptionPlanCard
            key={plan.planType}
            {...plan}
            userEmail={session.user.email}
            hasActiveSubscription={false} // <-- Adicionar prop como false
          />
        ))}
      </div>

      <div className="mt-8 max-w-lg text-center">
        <p className="text-sm text-gray-500">
          Junte-se a mais de 2.000 profissionais de saúde que já transformaram
          sua rotina. Garantia de satisfação de 07 dias ou seu dinheiro de
          volta.
        </p>
      </div>
    </div>
  );
}
