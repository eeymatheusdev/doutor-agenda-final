"use client";

import {
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  Mail,
  TrashIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deleteDoctor } from "@/actions/delete-doctor";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { doctorsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

// 1. CORREÇÃO: Importar DentalSpecialty
import { DentalSpecialty } from "../_constants";
import { getAvailability } from "../_helpers/availability";
import UpsertDoctorForm from "./upsert-doctor-form";

// 2. CORREÇÃO: Usar DentalSpecialty[] para 'specialties' e ajustar 'dateOfBirth' para ser compatível
// Novo tipo para o objeto doctor, já que specialties agora é um array
// Adicionando 'export' e ajustando a interface para refletir o tipo esperado
export interface Doctor
  extends Omit<
    typeof doctorsTable.$inferSelect,
    "specialties" | "dateOfBirth"
  > {
  specialties: DentalSpecialty[];
  dateOfBirth: Date;
}

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const [isUpsertDoctorDialogOpen, setIsUpsertDoctorDialogOpen] =
    useState(false);
  const deleteDoctorAction = useAction(deleteDoctor, {
    onSuccess: () => {
      toast.success("Médico deletado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao deletar médico.");
    },
  });
  const handleDeleteDoctorClick = () => {
    if (!doctor) return;
    deleteDoctorAction.execute({ id: doctor.id });
  };

  const doctorInitials = doctor.name
    .split(" ")
    .map((name) => name[0])
    .join("");
  const availability = getAvailability(doctor);
  // Exibe múltiplas especialidades unidas por vírgula
  const specialtiesText = doctor.specialties.join(", ");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{doctorInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{doctor.name}</h3>
            {/* Displaying multiple specialties */}
            <p className="text-muted-foreground text-sm">{specialtiesText}</p>
            <p className="text-muted-foreground text-sm">
              CRO/CRM: {doctor.cro}
            </p>
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <Mail className="size-3" />
              {doctor.email}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        <Badge variant="outline">
          <CalendarIcon className="mr-1" />
          {availability.from.format("dddd")} a {availability.to.format("dddd")}
        </Badge>
        <Badge variant="outline">
          <ClockIcon className="mr-1" />
          {availability.from.format("HH:mm")} as{" "}
          {availability.to.format("HH:mm")}
        </Badge>
        <Badge variant="outline">
          <DollarSignIcon className="mr-1" />
          {formatCurrencyInCents(doctor.appointmentPriceInCents)}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col gap-2">
        <Dialog
          open={isUpsertDoctorDialogOpen}
          onOpenChange={setIsUpsertDoctorDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full">Ver detalhes</Button>
          </DialogTrigger>
          <UpsertDoctorForm
            doctor={{
              ...doctor,
              // O campo dateOfBirth é convertido para string/null para o formulário
              dateOfBirth: doctor.dateOfBirth
                ? doctor.dateOfBirth.toString()
                : null,
              availableFromTime: availability.from.format("HH:mm:ss"),
              availableToTime: availability.to.format("HH:mm:ss"),
              // specialties já é DentalSpecialty[] devido à correção da interface 'Doctor'
              specialties: doctor.specialties,
            }}
            onSuccess={() => setIsUpsertDoctorDialogOpen(false)}
            isOpen={isUpsertDoctorDialogOpen}
          />
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <TrashIcon />
              Deletar médico
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Tem certeza que deseja deletar esse médico?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser revertida. Isso irá deletar o médico e
                todas as consultas agendadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDoctorClick}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default DoctorCard;
