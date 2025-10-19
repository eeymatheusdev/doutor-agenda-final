// src/app/(protected)/subscription/_components/subscription-plan-card.tsx

"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createStripeCheckout } from "@/actions/create-stripe-checkout";
import { createStripePortalSession } from "@/actions/create-stripe-portal-session";
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
  hasActiveSubscription?: boolean;
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
  isCurrentPlan = false,
  hasActiveSubscription = false,
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

  const createStripePortalSessionAction = useAction(createStripePortalSession, {
    onSuccess: ({ data }) => {
      if (data?.portalUrl) {
        router.push(data.portalUrl);
      } else {
        toast.error("Não foi possível obter a URL do portal. Tente novamente.");
      }
    },
    onError: (error) => {
      console.error("Stripe Portal Session Error:", error);
      toast.error(
        "Ocorreu um erro ao acessar o portal de gerenciamento. Tente novamente.",
      );
    },
  });

  const handleSubscribeClick = () => {
    createStripeCheckoutAction.execute({ priceId, planType });
  };

  const handleCancelSubscriptionClick = () => {
    // CORREÇÃO: Passar undefined como argumento
    createStripePortalSessionAction.execute(undefined);
  };

  const R$ = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const isProcessing =
    createStripeCheckoutAction.isExecuting ||
    createStripePortalSessionAction.isExecuting;

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
        <div className="flex items-baseline whitespace-nowrap">
          <span className="text-3xl font-bold">{R$.format(price)}</span>
          <span className="ml-1 text-gray-600">/ {interval}</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="mt-auto">
          <Button
            className="w-full"
            variant={isCurrentPlan ? "destructive" : "default"}
            onClick={
              isCurrentPlan
                ? handleCancelSubscriptionClick
                : handleSubscribeClick
            }
            disabled={isProcessing || (!isCurrentPlan && hasActiveSubscription)}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isCurrentPlan ? (
              "Cancelar Assinatura"
            ) : (
              "Assinar Agora"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
