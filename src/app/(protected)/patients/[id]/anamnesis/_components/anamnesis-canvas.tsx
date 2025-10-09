// src/app/(protected)/patients/[id]/anamnesis/_components/anamnesis-canvas.tsx
"use client";

import { Check, ClipboardList, Plus, Save } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import * as React from "react";
import { toast } from "sonner";

import { AnamnesisSchema } from "@/actions/anamnesis/schema";
import {
  getAnamnesesByPatient,
  upsertAnamnesis,
} from "@/actions/anamnesis/upsert-anamnesis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AnamnesisProvider, useAnamnesis } from "./anamnesis-context";
import AnamnesisForm from "./anamnesis-form";

interface AnamnesisCanvasProps {
  patientId: string;
}

// 1. Componente que utiliza o contexto (AnamnesisCanvasContent)
function AnamnesisCanvasContent() {
  const {
    currentAnamnesisId,
    currentAnamnesisVersion,
    currentAnamnesisData,
    resetToNewAnamnesis,
    patientId,
    // As funções de mutação e isSaving vêm do Provider (injecção de props)
    saveDraft,
    saveNewVersion,
    isSaving,
  } = useAnamnesis();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="size-5" />
            Ficha Clínica (Versão {currentAnamnesisVersion})
          </CardTitle>
          <div className="flex gap-2">
            {/* Botão para Novo Registro/Limpar */}
            <Button variant="outline" size="sm" onClick={resetToNewAnamnesis}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Rascunho
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {currentAnamnesisId
            ? `Editando Rascunho (ID: ${currentAnamnesisId.slice(0, 8)}...)`
            : `Criando Versão ${currentAnamnesisVersion}`}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <AnamnesisForm
          initialData={currentAnamnesisData}
          currentRecordId={currentAnamnesisId}
          // Passa as funções de mutação
          onSaveDraft={saveDraft}
          onSaveNewVersion={saveNewVersion}
          isSaving={isSaving}
          patientId={patientId}
        />
      </CardContent>
    </Card>
  );
}

// 2. Componente de Nível Superior que define o provedor (AnamnesisCanvas)
export default function AnamnesisCanvas({ patientId }: AnamnesisCanvasProps) {
  // FIX: Usa um componente wrapper para isolar o useAction e passar as props de mutação
  return <AnamnesisMutationsAndProvider patientId={patientId} />;
}

// Novo componente para definir a mutação e prover o contexto
function AnamnesisMutationsAndProvider({ patientId }: AnamnesisCanvasProps) {
  // FIX: Hook para chamar o refetch do contexto na função onSuccess
  const useMutatorRefetch = () => {
    const { refetchHistory } = useAnamnesis();
    return refetchHistory;
  };

  // Define a mutação
  const upsertAction = useAction(upsertAnamnesis, {
    onSuccess: ({ input }) => {
      // Correção: Chamamos o hook para obter a função de refetch (seguro por estar dentro do Provider)
      useMutatorRefetch()();

      if (input.id) {
        toast.success(`Rascunho da anamnese salvo com sucesso!`);
      } else {
        toast.success("Nova versão da anamnese criada com sucesso!");
      }
    },
    onError: (error) => {
      console.error("Anamnesis Save Error:", error);
      toast.error("Erro ao salvar a ficha clínica.");
    },
  });

  const isSaving = upsertAction.isExecuting;

  // Funções que chamam a Server Action (useAction.execute)
  const handleSaveDraft = React.useCallback(
    async (data: AnamnesisSchema, currentRecordId: string | undefined) => {
      upsertAction.execute({
        ...data,
        id: currentRecordId,
        patientId: data.patientId,
      } as any);
    },
    [upsertAction],
  );

  const handleSaveNewVersion = React.useCallback(
    async (data: AnamnesisSchema) => {
      upsertAction.execute({
        ...data,
        id: undefined,
        patientId: data.patientId,
      } as any);
    },
    [upsertAction],
  );

  return (
    <AnamnesisProvider
      patientId={patientId}
      saveDraft={handleSaveDraft}
      saveNewVersion={handleSaveNewVersion}
      isSaving={isSaving}
    >
      <AnamnesisCanvasContent />
    </AnamnesisProvider>
  );
}
