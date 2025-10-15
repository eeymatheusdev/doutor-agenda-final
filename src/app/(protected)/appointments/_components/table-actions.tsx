"use client";

import {
  Check,
  ClipboardList,
  Edit,
  MoreVerticalIcon,
  TrashIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { cancelAppointment } from "@/actions/cancel-appointment";
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
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doctorsTable, patientsTable } from "@/db/schema";

import { AppointmentWithRelations } from "./table-columns";
import UpsertAppointmentForm from "./upsert-appointment-form";

interface AppointmentsTableActionsProps {
  appointment: AppointmentWithRelations;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

const AppointmentsTableActions = ({
  appointment,
  patients,
  doctors,
}: AppointmentsTableActionsProps) => {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const [formType, setFormType] = useState<"edit" | "finalize">("edit");

  const cancelAppointmentAction = useAction(cancelAppointment, {
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento.");
    },
  });

  const handleCancelAppointmentClick = () => {
    if (!appointment) return;
    cancelAppointmentAction.execute({ id: appointment.id });
  };

  const openDialog = (type: "edit" | "finalize") => {
    setFormType(type);
    setUpsertDialogIsOpen(true);
  };

  return (
    <>
      <Dialog open={upsertDialogIsOpen} onOpenChange={setUpsertDialogIsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{appointment.patient.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/patients/${appointment.patientId}`}
                className="gap-2"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Ficha do Paciente
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog("edit")}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Agendamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog("finalize")}>
              <Check className="mr-2 h-4 w-4" />
              Finalizar Agendamento
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-red-500 hover:text-red-500 focus:text-red-500"
                >
                  <X className="mr-2 h-4 w-4 text-red-500" />
                  Cancelar Agendamento
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Tem certeza que deseja cancelar esse agendamento?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser revertida. Isso irá alterar o status
                    do agendamento para &quot;Cancelada&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelAppointmentClick}>
                    Cancelar Agendamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
        <UpsertAppointmentForm
          isOpen={upsertDialogIsOpen}
          appointment={appointment}
          patients={patients}
          doctors={doctors}
          onSuccess={() => setUpsertDialogIsOpen(false)}
          type={formType}
        />
      </Dialog>
    </>
  );
};

export default AppointmentsTableActions;
