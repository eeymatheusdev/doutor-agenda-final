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
} from "@/components/ui/tooltip";
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
// Definindo formas mais orgânicas (coroa) usando clip-path
const TOOTH_SHAPE_CLASSES: Record<"anterior" | "posterior", string> = {
  // Incisivos e Caninos: Tapered body, rounded crown for a more realistic look
  anterior:
    "rounded-t-lg [clip-path:polygon(0%_0%,100%_0%,100%_90%,85%_100%,15%_100%,0%_90%)]",
  // Molares e Pré-molares: Wider crown, subtle taper
  posterior:
    "rounded-t-lg [clip-path:polygon(0%_0%,100%_0%,100%_80%,80%_100%,20%_100%,0%_80%)]",
};

// Helper para obter o label da face
const getFaceLabel = (value: ToothFace) => {
  const faces = [
    { label: "Oclusal/Incisal", value: "oclusal" },
    { label: "Vestibular", value: "vestibular" },
    { label: "Lingual", value: "lingual" },
    { label: "Mesial", value: "mesial" },
    { label: "Distal", value: "distal" },
  ];
  return (
    faces.find((f) => f.value === value)?.label.split("/")[0] ||
    value.charAt(0).toUpperCase() + value.slice(1)
  );
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
  // A face oclusal ou incisal é definida pelo tipo de dente
  const isOcclusalOrIncisal = face === "oclusal" || face === "incisal";

  // Classes básicas para todas as faces
  const baseClasses = "absolute cursor-pointer transition-colors duration-150";

  // Cores: se tiver marca, usa a cor da marca, se não, um tom neutro para visualização
  const fillColor = mark?.color || "bg-transparent";
  const defaultFill = mark ? fillColor : "bg-gray-100/50";
  const hoverClass = mark ? "" : "hover:bg-gray-200/50";

  // Estilos posicionais e de recorte (clip-path)
  let faceClasses = "";
  let iconCenter = false;
  let hasBorder = true;

  switch (face) {
    case "oclusal":
      if (!isPosterior) return null;
      // Coroa (topo da coroa)
      faceClasses =
        "w-4/5 h-1/5 top-0 left-1/2 -translate-x-1/2 rounded-full z-30";
      iconCenter = true;
      hasBorder = false;
      break;
    case "incisal":
      if (isPosterior) return null;
      // Borda incisal (base da coroa no dente anterior)
      faceClasses =
        "w-4/5 h-1/5 bottom-0 left-1/2 -translate-x-1/2 rounded-full z-30";
      iconCenter = true;
      hasBorder = false;
      break;
    case "mesial":
      // Lateral esquerda (trapezoidal vertical)
      faceClasses =
        "w-1/4 h-3/5 top-1/5 left-0 rounded-l-md [clip-path:polygon(0%_0%,100%_20%,100%_80%,0%_100%)] z-20";
      break;
    case "distal":
      // Lateral direita (trapezoidal vertical)
      faceClasses =
        "w-1/4 h-3/5 top-1/5 right-0 rounded-r-md [clip-path:polygon(0%_20%,100%_0%,100%_100%,0%_80%)] z-20";
      break;
    case "vestibular":
    case "lingual":
      // Centro (o maior) - Corpo principal da coroa
      faceClasses =
        "w-3/5 h-4/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-t-full rounded-b-xl z-10";
      iconCenter = true;
      hasBorder = false; // A borda principal é do dente completo
      if (face === "lingual") {
        faceClasses = cn(faceClasses, "opacity-0 z-50"); // Lingual é transparente para clique
      } else {
        faceClasses = cn(faceClasses, "border-2 border-gray-300"); // Vestibular recebe uma borda de destaque
      }
      break;
  }

  const tooltipContent = mark
    ? `${ODONTOGRAM_STATUS_MAP[mark.status].label}: ${mark.observation || "Sem observação"}`
    : `Saudável / Clique para marcar ${getFaceLabel(face)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            baseClasses,
            faceClasses,
            defaultFill,
            hoverClass,
            hasBorder && "border-gray-300/50 hover:border-black/50",
          )}
          onClick={() => selectTooth(toothNumber, face)}
        >
          {/* Ícone no centro da face */}
          {iconCenter && mark && mark.status !== "saudavel" && (
            <Icon
              className={cn(
                "absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2",
                mark.status === "carie" && "text-red-700",
                mark.status === "restauracao" && "text-blue-700",
                mark.status === "implante" && "text-green-700",
              )}
            />
          )}
          {/* Rótulo para visualização de faces (Vestibular) */}
          {face === "vestibular" && (
            <span
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.6rem] font-bold text-gray-700",
                mark && mark.status !== "saudavel"
                  ? "opacity-0"
                  : "opacity-100", // Oculta se houver marcação
              )}
            >
              V
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
    (marks?.oclusal?.status === "ausente" &&
      marks?.oclusal?.status === "ausente") || // Check for posterior
    (marks?.incisal?.status === "ausente" &&
      marks?.incisal?.status === "ausente"); // Check for anterior

  // Determina as faces relevantes
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
        "relative flex size-12 items-center justify-center border-gray-400/50 bg-gray-200/50 shadow-lg",
        toothShapeClass,
        isMissing && "border-dashed opacity-30",
        className,
      )}
    >
      {/* Etiqueta do número do dente */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          isMissing ? "top-1/4" : "bottom-1/4", // Ajusta a posição
        )}
      >
        <span className="text-xs font-bold text-gray-700">{toothNumber}</span>
      </div>
      <div
        className={cn(
          "relative h-full w-full",
          isUpper ? "rotate-180" : "rotate-0", // Gira o dente inferior
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
