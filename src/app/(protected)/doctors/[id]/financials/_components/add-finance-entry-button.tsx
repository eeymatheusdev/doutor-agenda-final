"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import UpsertFinanceForm from "./upsert-finance-form";

interface AddFinanceEntryButtonProps {
  doctorId: string;
}

export default function AddFinanceEntryButton({
  doctorId,
}: AddFinanceEntryButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Lançamento
        </Button>
      </DialogTrigger>
      <UpsertFinanceForm
        doctorId={doctorId}
        onSuccess={() => setIsOpen(false)}
      />
    </Dialog>
  );
}
