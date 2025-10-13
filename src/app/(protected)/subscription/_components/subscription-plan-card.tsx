// src/app/(protected)/subscription/_components/subscription-plan-card.tsx

"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createStripeCheckout } from "@/actions/create-stripe-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubscriptionPlanCardProps {
  title: string;
  description: string;
  price: number;
  interval: string;
  priceId: string;
  planType: "monthly" | "semiannual" | "annual";
  features?: string[];
  isCurrentPlan?: boolean;
  userEmail: string;
  className?: string;
}

export function SubscriptionPlanCard({
  title,
  description,
  price,
  interval,
  priceId,
  planType,
  features,
  isCurrentPlan = false,
  userEmail,
  className,
}: SubscriptionPlanCardProps) {
  const router = useRouter();
  const createStripeCheckoutAction = useAction(createStripeCheckout, {
    onSuccess: async ({ data }) => {
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe publishable key not found");
      }
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      );
      if (!stripe || !data?.sessionId) {
        throw new Error("Stripe or Session ID not found");
      }
      await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
    },
    onError: (error) => {
      console.error("Stripe Checkout Error:", error);
      toast.error("Ocorreu um erro ao iniciar o checkout. Tente novamente.");
    },
  });

  const handleSubscribeClick = () => {
    createStripeCheckoutAction.execute({ priceId, planType });
  };

  const handleManagePlanClick = () => {
    if (process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL) {
      router.push(
        `${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}?prefilled_email=${userEmail}`,
      );
    } else {
      toast.error("URL do portal do cliente não configurada.");
    }
  };

  const R$ = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Card
      className={cn(
        "flex flex-col",
        isCurrentPlan && "border-primary ring-primary/50 ring-2",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {isCurrentPlan && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Plano Atual
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-bold">{R$.format(price)}</span>
          <span className="text-gray-600">/ {interval}</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        {features && features.length > 0 && (
          <div className="flex-1 space-y-4 border-t pt-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <p className="ml-3 text-gray-600">{feature}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-8">
          <Button
            className="w-full"
            variant={isCurrentPlan ? "outline" : "default"}
            onClick={
              isCurrentPlan ? handleManagePlanClick : handleSubscribeClick
            }
            disabled={createStripeCheckoutAction.isExecuting}
          >
            {createStripeCheckoutAction.isExecuting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isCurrentPlan ? (
              "Gerenciar Assinatura"
            ) : (
              "Assinar Agora"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
