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
} from "@/components/ui/tooltip"; // [Cite: 184]
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

const ToothFaceComp: React.FC<{
  face: ToothFace;
  mark?: ToothFaceMarks[ToothFace];
  toothNumber: ToothNumber;
  isUpper: boolean;
}> = ({ face, mark, toothNumber, isUpper }) => {
  const { selectTooth } = useOdontogram();
  const Icon = mark ? STATUS_ICON_MAP[mark.status] : Check;
  const tooltipContent = mark
    ? `${ODONTOGRAM_STATUS_MAP[mark.status].label}: ${mark.observation || "Sem observação"}`
    : "Saudável / Clique para marcar";

  // Classes básicas para todas as faces
  const baseClasses =
    "absolute cursor-pointer border border-gray-300/50 hover:border-black/50 transition-colors duration-150";

  // Cores: se tiver marca, usa a cor da marca, se não, transparente
  const fillColor = mark?.color || "bg-transparent";
  const defaultFill = mark ? fillColor : "bg-white/50";
  const hoverClass = mark ? "" : "hover:bg-gray-200/50";

  // Estilos posicionais simplificados:
  let faceClasses = "";
  let iconCenter = false;

  switch (face) {
    case "oclusal":
      // Centro (parte superior para oclusal/incisal)
      faceClasses = "w-full h-1/5 top-0 left-0 rounded-t-md";
      iconCenter = true;
      break;
    case "incisal":
      // Centro (parte inferior para oclusal/incisal)
      faceClasses = "w-full h-1/5 bottom-0 left-0 rounded-b-md";
      iconCenter = true;
      break;
    case "mesial":
      // Laterais
      faceClasses = "w-1/5 h-full left-0 top-0 rounded-l-md";
      break;
    case "distal":
      faceClasses = "w-1/5 h-full right-0 top-0 rounded-r-md";
      break;
    case "vestibular":
      // Centro (o maior)
      faceClasses = "w-3/5 h-full left-1/2 -translate-x-1/2 top-0";
      iconCenter = true;
      break;
    case "lingual":
      // Sobreposição invisível (para modal) - Simplificação visual
      faceClasses = "w-full h-full inset-0 opacity-0 z-50";
      break;
  }

  // Condição para que incisal/oclusal apareçam apenas nos dentes corretos
  const isPosterior = ["8", "7", "6", "5", "4"].includes(toothNumber[1]);
  const isAnterior = ["3", "2", "1"].includes(toothNumber[1]);

  if (
    (face === "oclusal" && isAnterior) ||
    (face === "incisal" && isPosterior)
  ) {
    return null;
  }

  // Oclusal e Mesial/Distal têm prioridade visual. Vestibular é a base.
  const visualZIndex =
    face === "oclusal" ||
    face === "incisal" ||
    face === "mesial" ||
    face === "distal"
      ? "z-20"
      : "z-10";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            baseClasses,
            faceClasses,
            defaultFill,
            hoverClass,
            visualZIndex,
          )}
          onClick={() => selectTooth(toothNumber, face)}
        >
          {/* Ícone no centro da face vestibular/oclusal/incisal */}
          {iconCenter && mark && (
            <Icon
              className={cn(
                "absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2",
                mark.status === "carie" && "text-red-700",
                mark.status === "restauracao" && "text-blue-700",
                mark.status === "implante" && "text-green-700",
                mark.status === "saudavel" && "text-green-500",
                face === "oclusal" && "top-[10%]", // Ajuste visual para a face oclusal
                face === "incisal" && "top-[90%]",
              )}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Dente: {toothNumber} | Face: {face} (
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

  // Determina as faces relevantes
  const isPosterior = ["8", "7", "6", "5", "4"].includes(toothNumber[1]);
  const facesToRender: ToothFace[] = [
    isPosterior ? "oclusal" : "incisal",
    "vestibular",
    "lingual",
    "mesial",
    "distal",
  ];

  return (
    <motion.div
      drag // Efeito de arrastar conforme solicitado
      dragConstraints={{ left: -10, right: 10, top: -10, bottom: 10 }}
      style={{ x, y, rotate: rotation, cursor: "grab" }}
      className={cn(
        "relative flex size-12 items-center justify-center rounded-lg border border-gray-400 p-1 shadow-md",
        "bg-white/50",
        isMissing && "border-dashed opacity-30",
        className,
      )}
    >
      <div className="absolute top-0 right-0 z-30 p-1 text-xs font-semibold">
        {toothNumber}
      </div>
      <div
        className={cn(
          "relative size-10",
          isUpper ? "" : "rotate-180", // Gira o dente inferior
        )}
      >
        {facesToRender.map((face) => (
          <ToothFaceComp
            key={face}
            face={face}
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

export default Tooth;
