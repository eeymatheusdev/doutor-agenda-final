"use client";

import AnamnesisCanvas from "../../../_components/anamnesis/anamnesis-canvas";
import AnamnesisHistory from "../../../_components/anamnesis/anamnesis-history";

export default function AnamnesisTab({ patientId }: { patientId: string }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
      <AnamnesisCanvas patientId={patientId} />
      <AnamnesisHistory patientId={patientId} />
    </div>
  );
}
