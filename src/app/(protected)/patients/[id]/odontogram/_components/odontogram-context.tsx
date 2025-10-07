// src/app/(protected)/patients/[id]/odontogram/_components/odontogram-context.tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  ODONTOGRAM_STATUS_MAP,
  PERMANENT_TEETH_FDI,
  ToothFace,
  ToothNumber,
} from "../_constants";
import { OdontogramMark, OdontogramState, VisualOdontogram } from "../_types";
import ToothModal from "./tooth-modal";

// [Cite: 179]
// -----------------------------------------------------------------------------
// 1. Helpers para Manipulação de Estado
// -----------------------------------------------------------------------------

function marksToState(marks: OdontogramMark[]): OdontogramState {
  const initialState = Object.values(PERMANENT_TEETH_FDI)
    .flat()
    .reduce((acc, toothNumber) => {
      acc[toothNumber] = { toothNumber, marks: {} };
      return acc;
    }, {} as OdontogramState);

  marks.forEach((mark) => {
    if (initialState[mark.toothNumber]) {
      initialState[mark.toothNumber].marks[mark.face] = mark;
    }
  });

  return initialState;
}

function stateToMarks(state: OdontogramState): OdontogramMark[] {
  const allMarks: OdontogramMark[] = Object.values(state).flatMap(
    (tooth) =>
      Object.values(tooth.marks).filter(
        (mark) => mark && mark.status !== "saudavel",
      ) as OdontogramMark[],
  );
  return allMarks;
}

function stateToVisual(state: OdontogramState): VisualOdontogram {
  return Object.values(state).reduce((acc, tooth) => {
    acc[tooth.toothNumber] = Object.entries(tooth.marks).reduce(
      (faceAcc, [face, mark]) => {
        if (mark) {
          faceAcc[face as ToothFace] = {
            color: ODONTOGRAM_STATUS_MAP[mark.status].color,
            status: mark.status,
            observation: mark.observation,
          };
        }
        return faceAcc;
      },
      {} as VisualOdontogram[ToothNumber],
    );
    return acc;
  }, {} as VisualOdontogram);
}

// -----------------------------------------------------------------------------
// 2. Context Definition e Hook
// -----------------------------------------------------------------------------

// Tipo de dado retornado pela query (objeto ou null)
type OdontogramFetchData = {
  id: string;
  marks: OdontogramMark[];
} | null;

interface OdontogramContextProps {
  patientId: string;
  odontogramId: string | undefined;
  odontogramState: OdontogramState;
  visualOdontogram: VisualOdontogram;
  selectedTooth: ToothNumber | null;
  selectedFace: ToothFace | null;
  isModalOpen: boolean;
  setOdontogramState: React.Dispatch<React.SetStateAction<OdontogramState>>;
  selectTooth: (toothNumber: ToothNumber, face: ToothFace) => void;
  closeModal: () => void;
  isLoading: boolean;
  isSaving: boolean;
  saveOdontogram: () => void;
}

const OdontogramContext = React.createContext<
  OdontogramContextProps | undefined
>(undefined);

export function useOdontogram() {
  const context = React.useContext(OdontogramContext);
  if (!context) {
    throw new Error("useOdontogram must be used within an OdontogramProvider");
  }
  return context;
}

// -----------------------------------------------------------------------------
// 3. Provider Component
// -----------------------------------------------------------------------------

interface OdontogramProviderProps {
  patientId: string;
  children: React.ReactNode;
}

export function OdontogramProvider({
  patientId,
  children,
}: OdontogramProviderProps) {
  const queryClient = useQueryClient();
  const [odontogramState, setOdontogramState] = React.useState<OdontogramState>(
    marksToState([]),
  );
  const [odontogramId, setOdontogramId] = React.useState<string | undefined>(
    undefined,
  );
  const [selectedTooth, setSelectedTooth] = React.useState<ToothNumber | null>(
    null,
  );
  const [selectedFace, setSelectedFace] = React.useState<ToothFace | null>(
    null,
  );

  const isModalOpen = !!selectedTooth && !!selectedFace;

  // Query para buscar dados existentes
  const { isLoading, refetch } = useQuery<
    OdontogramFetchData, // TQueryFnData
    Error, // TError
    OdontogramFetchData, // TData
    readonly ["odontogram", string] // TQueryKey
  >({
    queryKey: ["odontogram", patientId] as const,
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/odontogram`);
      if (!response.ok) throw new Error("Falha ao buscar odontograma");
      const data = await response.json();
      return data as OdontogramFetchData;
    },
    onSuccess: (data) => {
      if (data) {
        setOdontogramId(data.id);
        setOdontogramState(marksToState(data.marks || []));
      } else {
        // Inicializa com dentes saudáveis se não houver dados
        setOdontogramState(marksToState([]));
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Mutação para salvar dados no backend
  const { isPending: isSaving, mutate: saveMutate } = useMutation({
    mutationFn: async (marks: OdontogramMark[]) => {
      const response = await fetch(`/api/patients/${patientId}/odontogram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marks,
          odontogramId,
        }),
      });
      if (!response.ok) throw new Error("Falha ao salvar odontograma");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Odontograma salvo com sucesso!");
      setOdontogramId(data.odontogramId);
      queryClient.invalidateQueries({ queryKey: ["odontogram", patientId] }); // Invalida cache
    },
    onError: (error) => {
      console.error("Save Odontogram Error:", error);
      toast.error("Erro ao salvar odontograma.");
    },
  });

  const saveOdontogram = React.useCallback(() => {
    const marksToSave = stateToMarks(odontogramState);
    saveMutate(marksToSave);
  }, [odontogramState, saveMutate]);

  const selectTooth = React.useCallback(
    (toothNumber: ToothNumber, face: ToothFace) => {
      setSelectedTooth(toothNumber);
      setSelectedFace(face);
    },
    [],
  );

  const closeModal = React.useCallback(() => {
    setSelectedTooth(null);
    setSelectedFace(null);
  }, []);

  const visualOdontogram = React.useMemo(
    () => stateToVisual(odontogramState),
    [odontogramState],
  );

  const contextValue = React.useMemo(
    () => ({
      patientId,
      odontogramId,
      odontogramState,
      visualOdontogram,
      selectedTooth,
      selectedFace,
      isModalOpen,
      setOdontogramState,
      selectTooth,
      closeModal,
      isLoading,
      isSaving,
      saveOdontogram,
    }),
    [
      patientId,
      odontogramId,
      odontogramState,
      visualOdontogram,
      selectedTooth,
      selectedFace,
      isModalOpen,
      selectTooth,
      closeModal,
      isLoading,
      isSaving,
      saveOdontogram,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <OdontogramContext.Provider value={contextValue}>
      {children}
      <ToothModal />
    </OdontogramContext.Provider>
  );
}
