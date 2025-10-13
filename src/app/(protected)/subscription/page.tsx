import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

import { SubscriptionPlanCard } from "./_components/subscription-plan-card";

const plans = [
  {
    title: "Plano Mensal",
    description: "Ideal para começar.",
    price: 249.9,
    interval: "mês",
    priceId: process.env.STRIPE_MONTHLY_PLAN_PRICE_ID!,
    planType: "monthly" as const,
    features: [
      "Cadastro ilimitado de médicos",
      "Agendamentos ilimitados",
      "Métricas completas",
      "Cadastro ilimitado de pacientes",
      "Confirmação via WhatsApp",
      "Suporte prioritário",
    ],
  },
  {
    title: "Plano Semestral",
    description: "Economize com o plano de 6 meses.",
    price: 2749.9 / 6, // Exibindo o preço mensal equivalente
    interval: "mês (cobrado semestralmente)",
    priceId: process.env.STRIPE_SEMIANNUAL_PLAN_PRICE_ID!,
    planType: "semiannual" as const,
    features: [
      "Todos os benefícios do plano Mensal",
      "Desconto por pagamento antecipado",
      "Acesso antecipado a novos recursos",
    ],
  },
  {
    title: "Plano Anual",
    description: "O melhor custo-benefício.",
    price: 2499.9 / 12, // Exibindo o preço mensal equivalente
    interval: "mês (cobrado anualmente)",
    priceId: process.env.STRIPE_ANNUAL_PLAN_PRICE_ID!,
    planType: "annual" as const,
    features: [
      "Todos os benefícios do plano Semestral",
      "Maior desconto de todos",
      "Consultoria de onboarding",
    ],
  },
];

const SubscriptionPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic");
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Assinatura</PageTitle>
          <PageDescription>
            Gerencie ou escolha o plano que melhor se adapta à sua clínica.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.planType}
              {...plan}
              isCurrentPlan={session.user.plan === plan.planType}
              userEmail={session.user.email}
            />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default SubscriptionPage;
