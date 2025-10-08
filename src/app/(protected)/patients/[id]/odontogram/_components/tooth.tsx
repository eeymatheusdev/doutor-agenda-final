// src/app/(protected)/patients/[id]/odontogram/_components/tooth.tsx
"use client";

import { motion, useMotionValue } from "framer-motion";
import {
  AlertTriangle,
  Bone,
  Check,
  Circle,
  Stethoscope,
  X,
} from "lucide-react";
import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; //
import { cn } from "@/lib/utils";

import {
  ODONTOGRAM_STATUS_MAP,
  OdontogramStatus,
  ToothFace,
} from "../_constants";
import { ToothFaceMarks, ToothNumber } from "../_types";
import { useOdontogram } from "./odontogram-context";

interface ToothProps {
  toothNumber: ToothNumber;
  marks: ToothFaceMarks;
  className?: string;
  isUpper: boolean;
}

// Mapeamento de Status para Ícone (Lucide Icons)
const STATUS_ICON_MAP: Record<OdontogramStatus, React.ElementType> = {
  carie: AlertTriangle,
  restauracao: Check,
  canal: Circle,
  extracao: X,
  protese: Bone,
  implante: Stethoscope,
  ausente: X,
  saudavel: Check,
};

// --- CSS para Formato de Dente ---
// Base para o dente como um todo (será a face vestibular/lingual)
const TOOTH_SHAPE_CLASSES: Record<"base" | "anterior" | "posterior", string> = {
  base: "absolute inset-0 transition-colors duration-150",
  // Dentes de 1 a 3 (Incisivos e Caninos) são mais retangulares/curvos na incisal
  anterior:
    "w-full h-full rounded-b-lg rounded-t-sm [clip-path:polygon(0%_5%,100%_5%,100%_95%,80%_100%,20%_100%,0%_95%)]",
  // Dentes de 4 a 8 (Pré-molares e Molares) são mais quadrados/trapezoidais
  posterior:
    "w-full h-full rounded-md [clip-path:polygon(0%_10%,100%_10%,100%_90%,90%_100%,10%_100%,0%_90%)]",
};

// Helper para obter o label da face
const getFaceLabel = (value: ToothFace) => {
  const faces = [
    { label: "Oclusal/Incisal", value: "oclusal" },
    { label: "Vestibular", value: "vestibular" },
    { label: "Lingual", value: "lingual" },
    { label: "Mesial", value: "mesial" },
    { label: "Distal", value: "distal" },
    { label: "Incisal", value: "incisal" },
  ];
  // Retorna apenas a primeira parte do label, se houver barra
  return faces.find((f) => f.value === value)?.label.split("/")[0] || value;
};

// --- Componente da Face ---

const ToothFaceComp: React.FC<{
  face: ToothFace;
  mark?: ToothFaceMarks[ToothFace];
  toothNumber: ToothNumber;
  isUpper: boolean;
}> = ({ face, mark, toothNumber, isUpper }) => {
  const { selectTooth } = useOdontogram();
  const Icon = mark ? STATUS_ICON_MAP[mark.status] : Check;

  // Determinação se é dente posterior ou anterior
  const isPosterior = ["8", "7", "6", "5", "4"].includes(toothNumber[1]);
  const isAnterior = ["3", "2", "1"].includes(toothNumber[1]);

  // Classes básicas para todas as faces
  const baseClasses =
    "absolute cursor-pointer border border-gray-300/50 hover:border-black/50 transition-colors duration-150";

  // Cores: se tiver marca, usa a cor da marca, se não, transparente
  const fillColor = mark?.color || "bg-transparent";
  const defaultFill = mark ? fillColor : "bg-white/50";
  const hoverClass = mark ? "" : "hover:bg-gray-200/50";

  // Estilos posicionais e de recorte (clip-path)
  let faceClasses = "";
  let iconCenter = false;

  switch (face) {
    case "oclusal":
      if (!isPosterior) return null; // Apenas para dentes posteriores
      // Faixa superior para oclusal (dentes posteriores)
      faceClasses =
        "w-full h-1/5 top-0 left-0 rounded-t-md [clip-path:polygon(10%_0%,90%_0%,95%_100%,5%_100%)] z-30";
      iconCenter = true;
      break;
    case "incisal":
      if (!isAnterior) return null; // Apenas para dentes anteriores
      // Faixa inferior para incisal (dentes anteriores)
      faceClasses =
        "w-full h-1/5 bottom-0 left-0 rounded-b-md [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%)] z-30";
      iconCenter = true;
      break;
    case "mesial":
      // Lateral esquerda (trapezoidal)
      faceClasses =
        "w-1/5 h-full left-0 top-0 rounded-l-md [clip-path:polygon(0%_10%,100%_20%,100%_80%,0%_90%)] z-20";
      break;
    case "distal":
      // Lateral direita (trapezoidal)
      faceClasses =
        "w-1/5 h-full right-0 top-0 rounded-r-md [clip-path:polygon(0%_20%,100%_10%,100%_90%,0%_80%)] z-20";
      break;
    case "vestibular":
      // Centro (o maior) - Usa a forma principal do dente
      faceClasses = cn(
        isPosterior
          ? TOOTH_SHAPE_CLASSES.posterior
          : TOOTH_SHAPE_CLASSES.anterior,
        "z-10",
      );
      iconCenter = true;
      break;
    case "lingual":
      // Camada interna, invisível, mas com a forma do dente para o clique do modal
      faceClasses = cn(
        isPosterior
          ? TOOTH_SHAPE_CLASSES.posterior
          : TOOTH_SHAPE_CLASSES.anterior,
        "opacity-0 z-50",
      );
      break;
  }

  const tooltipContent = mark
    ? `${ODONTOGRAM_STATUS_MAP[mark.status].label}: ${mark.observation || "Sem observação"}`
    : `Saudável / Clique para marcar ${getFaceLabel(face)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(baseClasses, faceClasses, defaultFill, hoverClass)}
          onClick={() => selectTooth(toothNumber, face)}
        >
          {/* Ícone no centro da face vestibular/oclusal/incisal */}
          {iconCenter && mark && mark.status !== "saudavel" && (
            <Icon
              className={cn(
                "absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2",
                mark.status === "carie" && "text-red-700",
                mark.status === "restauracao" && "text-blue-700",
                mark.status === "implante" && "text-green-700",
                // Ajuste visual para dentes posteriores/anteriores
                face === "oclusal" && "top-[20%] text-white",
                face === "incisal" && "top-[80%] text-white",
              )}
            />
          )}
          {/* Rótulo para visualização de dentes (Vestibular) */}
          {face === "vestibular" && (
            <span
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.6rem] font-bold text-gray-700",
                mark && mark.status !== "saudavel"
                  ? "opacity-0"
                  : "opacity-100", // Oculta se houver marcação para o ícone aparecer
              )}
            >
              {face.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Dente: {toothNumber} | Face: {getFaceLabel(face)} (
          {ODONTOGRAM_STATUS_MAP[mark?.status || "saudavel"].label})
        </p>
        {mark?.observation && (
          <p className="mt-1 text-xs">{mark.observation}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export const Tooth: React.FC<ToothProps> = ({
  toothNumber,
  marks,
  className,
  isUpper,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotation = useMotionValue(0);

  // Se o dente estiver ausente, marcamos o componente principal.
  const isMissing =
    marks?.oclusal?.status === "ausente" ||
    marks?.incisal?.status === "ausente";

  // Determina as faces relevantes (Ajustando a lógica para usar oclusal ou incisal)
  const isPosterior = ["8", "7", "6", "5", "4"].includes(toothNumber[1]);

  // Construindo a lista de faces para renderizar
  const facesToRender: ToothFace[] = [
    isPosterior ? "oclusal" : "incisal",
    "vestibular",
    "lingual",
    "mesial",
    "distal",
  ];

  // Classe de forma do dente para o container principal
  const toothShapeClass = isPosterior
    ? TOOTH_SHAPE_CLASSES.posterior
    : TOOTH_SHAPE_CLASSES.anterior;

  return (
    <motion.div
      drag // Efeito de arrastar conforme solicitado
      dragConstraints={{ left: -10, right: 10, top: -10, bottom: 10 }}
      style={{ x, y, rotate: rotation, cursor: "grab" }}
      className={cn(
        "relative flex size-12 items-center justify-center border-gray-400 p-0 shadow-md",
        "bg-white/50",
        // Aplica a forma no container principal para o clique/visual
        toothShapeClass,
        isMissing && "border-dashed opacity-30",
        className,
      )}
    >
      {/* Etiqueta do número do dente */}
      <div className="absolute top-0 right-0 z-40 p-1 text-xs font-semibold">
        {toothNumber}
      </div>
      <div
        className={cn(
          "relative h-full w-full",
          isUpper ? "rotate-180" : "", // Gira o dente inferior
        )}
      >
        {facesToRender.map((face) => (
          <ToothFaceComp
            key={face}
            face={face as ToothFace}
            mark={marks[face]}
            toothNumber={toothNumber}
            isUpper={isUpper}
          />
        ))}
      </div>
      {isMissing && (
        <X className="absolute z-50 h-8 w-8 text-gray-500" strokeWidth={3} />
      )}
    </motion.div>
  );
};
