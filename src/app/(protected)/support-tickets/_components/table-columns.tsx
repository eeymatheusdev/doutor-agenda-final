// src/app/(protected)/support-tickets/_components/table-columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { supportTicketsTable, usersTable } from "@/db/schema";
import { cn } from "@/lib/utils";

// Tipo para o dado da linha, incluindo o usuário
export type SupportTicketWithUser = typeof supportTicketsTable.$inferSelect & {
  user: Pick<typeof usersTable.$inferSelect, "name" | "email"> | null;
};

// Helper para mapear status para label e cor
const getStatusProps = (status: SupportTicketWithUser["status"]) => {
  switch (status) {
    case "pending":
      return {
        label: "Pendente",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      };
    case "in_progress":
      return {
        label: "Em Andamento",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      };
    case "resolved":
      return {
        label: "Resolvido",
        color: "bg-green-100 text-green-800 border-green-300",
      };
    default:
      return {
        label: status,
        color: "bg-gray-100 text-gray-800 border-gray-300",
      };
  }
};

export const columns: ColumnDef<SupportTicketWithUser>[] = [
  {
    accessorKey: "id",
    header: "#",
  },
  {
    accessorKey: "subject",
    header: "Assunto",
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => (
      <p className="max-w-xs truncate">{row.original.description}</p> // Truncate description
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { label, color } = getStatusProps(row.original.status);
      return (
        <Badge variant="outline" className={cn(color)}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "user.name", // Acessa o nome do usuário aninhado
    header: "Aberto por",
    cell: ({ row }) =>
      row.original.user?.name ?? row.original.user?.email ?? "-",
  },
  {
    accessorKey: "createdAt",
    header: "Data Abertura",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      }),
  },
  {
    accessorKey: "updatedAt",
    header: "Última Atualização",
    cell: ({ row }) => {
      // CORREÇÃO: Adicionada verificação de nulidade
      const updatedAt = row.original.updatedAt;
      return updatedAt
        ? format(new Date(updatedAt), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          })
        : "-"; // Ou algum valor padrão se for null
    },
  },
  // { // Coluna de Ações (pode ser adicionada futuramente)
  //   id: "actions",
  //   cell: ({ row }) => {
  //     // Aqui você pode adicionar botões para ver detalhes, mudar status, etc.
  //     return <div>...</div>;
  //   },
  // },
];
