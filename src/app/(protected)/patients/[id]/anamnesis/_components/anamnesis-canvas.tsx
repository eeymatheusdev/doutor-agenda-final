"use client";

import { Check, ClipboardList, Plus, Save } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AnamnesisProvider, useAnamnesis } from "./anamnesis-context";
import AnamnesisForm from "./anamnesis-form";

interface AnamnesisCanvasBaseProps {
  patientId: string;
}

function AnamnesisCanvasBase() {
  const {
    currentAnamnesisId,
    currentAnamnesisVersion,
    currentAnamnesisData,
    saveDraft,
    saveNewVersion,
    resetToNewAnamnesis,
    isSaving,
    patientId,
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
            {/* O botão Salvar Rascunho/Novo Registro será interno ao formulário para capturar os dados */}
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
          onSaveDraft={saveDraft}
          onSaveNewVersion={saveNewVersion}
          isSaving={isSaving}
          patientId={patientId}
        />
      </CardContent>
    </Card>
  );
}

export default function AnamnesisCanvas(props: AnamnesisCanvasBaseProps) {
  return (
    <AnamnesisProvider patientId={props.patientId}>
      <AnamnesisCanvasBase />
    </AnamnesisProvider>
  );
}
