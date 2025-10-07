// src/app/(protected)/patients/[id]/odontogram/_components/odontogram-canvas.tsx
"use client";

import { Save } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { PERMANENT_TEETH_FDI, QuadrantKeys, ToothNumber } from "../_constants";
import { OdontogramProvider, useOdontogram } from "./odontogram-context";
import { Tooth } from "./tooth";

interface OdontogramCanvasBaseProps {
  patientId: string;
}

const QUADRANT_IS_UPPER: Record<QuadrantKeys, boolean> = {
  quadrant1: true,
  quadrant2: true,
  quadrant3: false,
  quadrant4: false,
};

function Quadrant({
  quadrant,
  isUpper,
}: {
  quadrant: ToothNumber[];
  isUpper: boolean;
}) {
  const { visualOdontogram } = useOdontogram();
  return (
    <div className={"flex min-w-[280px] gap-1"}>
      {quadrant.map((toothNumber) => (
        <Tooth
          key={toothNumber}
          toothNumber={toothNumber}
          marks={visualOdontogram[toothNumber] || {}}
          isUpper={isUpper}
        />
      ))}
    </div>
  );
}

function OdontogramCanvasBase() {
  const { saveOdontogram, isSaving } = useOdontogram();

  return (
    <Card className="max-w-6xl">
      <CardHeader>
        <CardTitle>Arcada Dentária Permanente</CardTitle>
        <div className="flex justify-end">
          <Button onClick={saveOdontogram} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Odontograma"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          {/* Arcada Superior */}
          <div className="flex justify-center gap-4">
            {/* Superior Direito (18 a 11) */}
            <Quadrant
              quadrant={PERMANENT_TEETH_FDI.quadrant1}
              isUpper={QUADRANT_IS_UPPER.quadrant1}
            />
            {/* Superior Esquerdo (21 a 28) */}
            <Quadrant
              quadrant={PERMANENT_TEETH_FDI.quadrant2}
              isUpper={QUADRANT_IS_UPPER.quadrant2}
            />
          </div>

          <Separator className="w-full" />

          {/* Arcada Inferior */}
          <div className="flex justify-center gap-4">
            {/* Inferior Direito (41 a 48) */}
            <Quadrant
              quadrant={PERMANENT_TEETH_FDI.quadrant4}
              isUpper={QUADRANT_IS_UPPER.quadrant4}
            />
            {/* Inferior Esquerdo (31 a 38) */}
            <Quadrant
              quadrant={PERMANENT_TEETH_FDI.quadrant3}
              isUpper={QUADRANT_IS_UPPER.quadrant3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OdontogramCanvas(props: OdontogramCanvasBaseProps) {
  return (
    <OdontogramProvider patientId={props.patientId}>
      <OdontogramCanvasBase />
    </OdontogramProvider>
  );
}
