"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AnamnesisSchema, anamnesisSchema } from "@/actions/anamnesis/schema";
import {
  getAnamnesesByPatient,
  upsertAnamnesis,
} from "@/actions/anamnesis/upsert-anamnesis";
import { AnamnesisRecord } from "@/actions/anamnesis/upsert-anamnesis";
import { authClient } from "@/lib/auth-client";

// --- Definição do Contexto ---

interface AnamnesisContextProps {
  // Estado
  currentAnamnesisData: AnamnesisSchema;
  currentAnamnesisId: string | undefined;
  currentAnamnesisVersion: number;
  allAnamnesisRecords: AnamnesisRecord[] | undefined;
  isLoadingHistory: boolean;
  isSaving: boolean;

  // Dados obrigatórios
  patientId: string;
  userId: string;

  // Ações
  loadRecordToCanvas: (record: AnamnesisRecord) => void;
  resetToNewAnamnesis: () => void;
  setFormData: React.Dispatch<React.SetStateAction<AnamnesisSchema>>;
  saveDraft: (data: AnamnesisSchema) => Promise<void>;
  saveNewVersion: (data: AnamnesisSchema) => Promise<void>;
}

const AnamnesisContext = React.createContext<AnamnesisContextProps | undefined>(
  undefined,
);

export const useAnamnesis = () => {
  const context = React.useContext(AnamnesisContext);
  if (!context) {
    throw new Error("useAnamnesis must be used within an AnamnesisProvider");
  }
  return context;
};

const getInitialAnamnesisData = (patientId: string): AnamnesisSchema => ({
  patientId,
  // Valores iniciais para listas e objetos complexos (coerção para Zod)
  knownConditions: [],
  painCharacteristics: [],
  currentMedications: [],
  allergies: [],
  attachments: [],
  smoking: {
    isSmoker: false,
    packPerDay: null,
    years: null,
  },
  pregnancy: false,
  breastfeeding: false,
  bleedingProblems: false,
  anesthesiaComplicationsHistory: false,
  drugUse: false,
  bruxism: false,
  oralHygieneMouthwashUse: false,
  anesthesiaAllergies: false,
  sensitivityToColdHot: false,
  tmjSymptoms: false,
  consentSigned: false,
});

export function AnamnesisProvider({
  patientId,
  children,
}: AnamnesisProviderProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id || "";

  const [currentAnamnesisData, setCurrentAnamnesisData] =
    React.useState<AnamnesisSchema>(getInitialAnamnesisData(patientId));

  const [currentAnamnesisId, setCurrentAnamnesisId] = React.useState<
    string | undefined
  >(undefined);
  const [currentAnamnesisVersion, setCurrentAnamnesisVersion] =
    React.useState(1);
  const [isSaving, setIsSaving] = React.useState(false);

  // --- Busca de Histórico ---
  const {
    data: allAnamnesisRecords,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery<AnamnesisRecord[]>({
    queryKey: ["anamnesis-history", patientId],
    queryFn: () =>
      getAnamnesesByPatient({ patientId: patientId }).then((res) => res.data),
    enabled: !!session?.user?.clinic?.id && !!patientId,
  });

  // Carrega o registro mais recente (rascunho ou versão mais alta) na inicialização
  React.useEffect(() => {
    if (allAnamnesisRecords && allAnamnesisRecords.length > 0) {
      loadRecordToCanvas(allAnamnesisRecords[0], { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnamnesisRecords?.length, patientId]);

  // --- Ações ---

  const loadRecordToCanvas = React.useCallback(
    (record: AnamnesisRecord, { silent = false } = {}) => {
      try {
        // Mescla o JSONB 'data' com o tipo AnamnesisSchema e define campos de controle
        const loadedData = anamnesisSchema.parse({
          id: record.id,
          patientId: record.patientId,
          ...record.data,
          attachments: record.attachments || [],
          // Garante que campos opcionais ausentes no JSONB voltem a ser arrays vazios/objetos padrão
          knownConditions: record.data.knownConditions || [],
          painCharacteristics: record.data.painCharacteristics || [],
          currentMedications: record.data.currentMedications || [],
          allergies: record.data.allergies || [],
          smoking: record.data.smoking || {
            isSmoker: false,
            packPerDay: null,
            years: null,
          },
          // Converte strings de data para objetos Date para o formulário
          onsetDate: record.data.onsetDate
            ? new Date(record.data.onsetDate)
            : null,
          lastDentalVisit: record.data.lastDentalVisit
            ? new Date(record.data.lastDentalVisit)
            : null,
          consentDate: record.data.consentDate
            ? new Date(record.data.consentDate)
            : null,
          followUpDate: record.data.followUpDate
            ? new Date(record.data.followUpDate)
            : null,
        });

        setCurrentAnamnesisData(loadedData as any);
        setCurrentAnamnesisId(record.id);
        setCurrentAnamnesisVersion(record.version);

        if (!silent) {
          toast.info(
            `Visualizando versão ${record.version} de ${format(record.createdAt, "dd/MM/yyyy", { locale: ptBR })} (${record.status}).`,
          );
        }
      } catch (e) {
        console.error("Error parsing anamnesis record:", e);
        toast.error("Erro ao carregar dados do registro de anamnese.");
      }
    },
    [],
  );

  const resetToNewAnamnesis = React.useCallback(() => {
    setCurrentAnamnesisData(getInitialAnamnesisData(patientId));
    setCurrentAnamnesisId(undefined); // Novo registro
    setCurrentAnamnesisVersion((allAnamnesisRecords?.[0]?.version || 0) + 1);
    toast.info("Iniciando nova ficha clínica.");
  }, [patientId, allAnamnesisRecords]);

  const saveDraft = React.useCallback(
    async (data: AnamnesisSchema) => {
      setIsSaving(true);
      try {
        const formattedData = {
          ...data,
          // Coerce Date objects to string for the server action
          onsetDate: data.onsetDate
            ? format(data.onsetDate, "yyyy-MM-dd")
            : null,
          lastDentalVisit: data.lastDentalVisit
            ? format(data.lastDentalVisit, "yyyy-MM-dd")
            : null,
          consentDate: data.consentDate
            ? format(data.consentDate, "yyyy-MM-dd")
            : null,
          followUpDate: data.followUpDate
            ? format(data.followUpDate, "yyyy-MM-dd")
            : null,
        };

        const result = await upsertAnamnesis({
          ...formattedData,
          id: currentAnamnesisId,
          patientId: data.patientId,
        });

        if (result.serverError) {
          throw new Error(result.serverError);
        }

        toast.success(
          `Rascunho da versão ${currentAnamnesisVersion} salvo com sucesso!`,
        );
        refetchHistory();
      } catch (error) {
        console.error("Save Draft Error:", error);
        toast.error("Erro ao salvar rascunho da anamnese.");
      } finally {
        setIsSaving(false);
      }
    },
    [currentAnamnesisId, currentAnamnesisVersion, refetchHistory],
  );

  const saveNewVersion = React.useCallback(
    async (data: AnamnesisSchema) => {
      setIsSaving(true);
      try {
        const formattedData = {
          ...data,
          // Coerce Date objects to string for the server action
          onsetDate: data.onsetDate
            ? format(data.onsetDate, "yyyy-MM-dd")
            : null,
          lastDentalVisit: data.lastDentalVisit
            ? format(data.lastDentalVisit, "yyyy-MM-dd")
            : null,
          consentDate: data.consentDate
            ? format(data.consentDate, "yyyy-MM-dd")
            : null,
          followUpDate: data.followUpDate
            ? format(data.followUpDate, "yyyy-MM-dd")
            : null,
        };

        // Salva como nova versão (sem passar ID, forçando INSERT)
        const result = await upsertAnamnesis({
          ...formattedData,
          id: undefined,
          patientId: data.patientId,
        });

        if (result.serverError) {
          throw new Error(result.serverError);
        }

        toast.success("Nova versão da anamnese criada com sucesso!");
        refetchHistory();
        // O useEffect recarrega o registro mais recente (a nova versão)
      } catch (error) {
        console.error("Save New Version Error:", error);
        toast.error("Erro ao criar nova versão da anamnese.");
      } finally {
        setIsSaving(false);
      }
    },
    [refetchHistory],
  );

  const setFormData = setCurrentAnamnesisData;

  const contextValue = React.useMemo(
    () => ({
      currentAnamnesisData,
      currentAnamnesisId,
      currentAnamnesisVersion,
      allAnamnesisRecords,
      isLoadingHistory,
      isSaving,
      patientId,
      userId,
      loadRecordToCanvas,
      resetToNewAnamnesis,
      setFormData,
      saveDraft,
      saveNewVersion,
    }),
    [
      currentAnamnesisData,
      currentAnamnesisId,
      currentAnamnesisVersion,
      allAnamnesisRecords,
      isLoadingHistory,
      isSaving,
      patientId,
      userId,
      loadRecordToCanvas,
      resetToNewAnamnesis,
      setFormData,
      saveDraft,
      saveNewVersion,
    ],
  );

  return (
    <AnamnesisContext.Provider value={contextValue}>
      {children}
    </AnamnesisContext.Provider>
  );
}
