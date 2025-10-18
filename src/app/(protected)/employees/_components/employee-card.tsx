// src/app/(protected)/employees/_components/employee-card.tsx
"use client";

import {
  CalendarIcon,
  ClockIcon,
  Mail,
  Phone,
  TrashIcon,
  User,
} from "lucide-react"; // Adicionei User
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";

import { deleteEmployee } from "@/actions/delete-employee"; // Importa a nova action
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { employeesTable } from "@/db/schema"; // Importa a nova tabela

import { EmployeeRole } from "../_constants"; // Importa as novas constantes
import { getAvailability } from "../_helpers/availability"; // Reutiliza helper
import UpsertEmployeeForm from "./upsert-employee-form"; // Importa o novo formulário

// Interface adaptada da interface Doctor
export interface Employee
  extends Omit<typeof employeesTable.$inferSelect, "role" | "dateOfBirth"> {
  role: EmployeeRole[]; // ALTERADO: role agora é um array
  dateOfBirth: Date;
}

interface EmployeeCardProps {
  employee: Employee; // Usa o tipo Employee
}

const EmployeeCard = ({ employee }: EmployeeCardProps) => {
  const [isUpsertEmployeeDialogOpen, setIsUpsertEmployeeDialogOpen] =
    useState(false);
  const deleteEmployeeAction = useAction(deleteEmployee, {
    // Usa a nova action
    onSuccess: () => {
      toast.success("Funcionário deletado com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao deletar funcionário.");
    },
  });
  const handleDeleteEmployeeClick = () => {
    if (!employee) return;
    deleteEmployeeAction.execute({ id: employee.id });
  };

  const employeeInitials = employee.name
    .split(" ")
    .map((name) => name[0])
    .join("");
  const availability = getAvailability(employee); // Reutiliza helper
  const rolesText = employee.role.join(", ");

  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(
        7, // Corrigido para slice(7)
      )}`;
    }
    return phone;
  };

  const formatWhatsAppNumber = (whatsApp: string | null | undefined) => {
    if (!whatsApp) return "";
    const cleaned = whatsApp.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
        7,
      )}`;
    }
    return whatsApp;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={employee.avatarImageUrl || ""}
                alt={employee.name || "Foto"}
              />
              <AvatarFallback>{employeeInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-medium">{employee.name}</h3>
              {/* Mostra os cargos */}
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <User className="size-3" />
                {rolesText} {/* ALTERADO: Usa rolesText */}
              </p>
              {/* Removido CRO/CRM */}
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <Mail className="size-3" />
                {employee.email}
              </p>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                {employee.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {formatPhoneNumber(employee.phone)}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                {employee.whatsApp && (
                  <span className="flex items-center gap-1">
                    <FaWhatsapp className="size-3" />
                    {formatWhatsAppNumber(employee.whatsApp)}
                  </span>
                )}
              </div>
            </div>
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
          {availability.from.format("HH:mm")} às{" "}
          {/* Corrigido 'as' para 'às' */}
          {availability.to.format("HH:mm")}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col gap-2">
        <Dialog
          open={isUpsertEmployeeDialogOpen}
          onOpenChange={setIsUpsertEmployeeDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full">Ver detalhes</Button>
          </DialogTrigger>
          {/* Usa o novo formulário */}
          <UpsertEmployeeForm
            employee={{
              ...employee,
              dateOfBirth: employee.dateOfBirth
                ? employee.dateOfBirth.toString()
                : null,
              availableFromTime: availability.from.format("HH:mm:ss"),
              availableToTime: availability.to.format("HH:mm:ss"),
              role: employee.role, // Passa o array de 'role'
            }}
            onSuccess={() => setIsUpsertEmployeeDialogOpen(false)}
            isOpen={isUpsertEmployeeDialogOpen}
          />
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <TrashIcon />
              Deletar funcionário
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Tem certeza que deseja deletar esse funcionário?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser revertida. Isso irá deletar o funcionário
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEmployeeClick}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default EmployeeCard;
