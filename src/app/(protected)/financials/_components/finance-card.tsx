import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

interface FinanceCardProps {
  title: string;
  amount: number;
}

export default function FinanceCard({ title, amount }: FinanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${amount < 0 ? "text-destructive" : ""}`}
        >
          {formatCurrencyInCents(amount * 100)}
        </div>
      </CardContent>
    </Card>
  );
}
