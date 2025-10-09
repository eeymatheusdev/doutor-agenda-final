"use client";

import { ArrowLeft, Edit, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deletePatient } from "@/actions/delete-patient";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageActions,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { patientsTable } from "@/db/schema";

import UpsertPatientForm from "../../_components/upsert-patient-form"; // <-- CAMINHO CORRIGIDO

interface PatientHeaderProps {
  patient: typeof patientsTable.$inferSelect;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const { execute, isExecuting } = useAction(deletePatient, {
    onSuccess: () => {
      toast.success("Paciente deletado com sucesso.");
      // You might want to redirect the user after deletion
    },
    onError: () => {
      toast.error("Erro ao deletar paciente.");
    },
  });

  return (
    <>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{patient.name}</PageTitle>
          <PageDescription>
            ID: {patient.id} | CPF: {patient.cpf} | Status:{" "}
            <Badge
              variant={
                patient.financialStatus === "inadimplente"
                  ? "destructive"
                  : "default"
              }
              className={
                patient.financialStatus === "adimplente"
                  ? "bg-green-500 hover:bg-green-600"
                  : ""
              }
            >
              {patient.financialStatus === "inadimplente"
                ? "Inadimplente"
                : "Adimplente"}
            </Badge>
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <Button variant="outline" asChild>
            <Link href="/patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Dialog
            open={upsertDialogIsOpen}
            onOpenChange={setUpsertDialogIsOpen}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setUpsertDialogIsOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Tem certeza que deseja deletar esse paciente?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser revertida. Isso irá deletar o
                        paciente e todos os seus dados associados
                        permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => execute({ id: patient.id })}
                        disabled={isExecuting}
                      >
                        {isExecuting ? "Excluindo..." : "Excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
            <UpsertPatientForm
              isOpen={upsertDialogIsOpen}
              patient={patient}
              onSuccess={() => setUpsertDialogIsOpen(false)}
            />
          </Dialog>
        </PageActions>
      </PageHeader>
    </>
  );
}
