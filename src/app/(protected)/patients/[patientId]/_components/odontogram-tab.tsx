"use client";

import OdontogramCanvas from "@/app/(protected)/patients/_components/odontogram/odontogram-canvas";
import OdontogramHistory from "@/app/(protected)/patients/_components/odontogram/odontogram-history";
import { doctorsTable } from "@/db/schema";

type Doctor = Pick<
  typeof doctorsTable.$inferSelect,
  "id" | "name" | "specialties"
>;
interface OdontogramTabProps {
  patientId: string;
  doctors: Doctor[];
}

export default function OdontogramTab({
  patientId,
  doctors,
}: OdontogramTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
      <OdontogramCanvas patientId={patientId} doctors={doctors} />
      <OdontogramHistory patientId={patientId} doctors={doctors} />
    </div>
  );
}
