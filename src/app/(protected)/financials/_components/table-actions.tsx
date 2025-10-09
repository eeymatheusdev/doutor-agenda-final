"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import * as React from "react";
import { toast } from "sonner";

import { deleteClinicFinance } from "@/actions/clinic-finances";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent, // Importação adicionada
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clinicFinancesTable } from "@/db/schema";

import UpsertFinanceForm from "./upsert-finance-form";

type Transaction = typeof clinicFinancesTable.$inferSelect;

interface FinancialsTableActionsProps {
  transaction: Transaction;
}

export default function FinancialsTableActions({
  transaction,
}: FinancialsTableActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const { execute, isExecuting } = useAction(deleteClinicFinance, {
    onSuccess: () => {
      toast.success("Lançamento deletado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao deletar lançamento.");
    },
  });

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          </DialogTrigger>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                className="text-red-600"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Isso irá deletar
                  permanentemente o lançamento financeiro.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => execute({ id: transaction.id })}
                  disabled={isExecuting}
                >
                  {isExecuting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <UpsertFinanceForm
          entry={transaction}
          onSuccess={() => setIsEditDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
