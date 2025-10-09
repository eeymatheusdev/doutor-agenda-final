"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { doctorsTable } from "@/db/schema";

const PatientInfoTab = React.lazy(() => import("./patient-info-tab"));
const OdontogramTab = React.lazy(() => import("./odontogram-tab"));
const AnamnesisTab = React.lazy(() => import("./anamnesis-tab"));

type Doctor = Pick<
  typeof doctorsTable.$inferSelect,
  "id" | "name" | "specialties"
>;

interface PatientTabsProps {
  patientId: string;
  doctors: Doctor[];
}

export function PatientTabs({ patientId, doctors }: PatientTabsProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "info";

  return (
    <Tabs defaultValue={defaultTab} className="mt-4 w-full">
      <TabsList className="bg-background sticky top-0 z-10">
        <TabsTrigger value="info">Dados Cadastrais</TabsTrigger>
        <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
        <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
        <TabsTrigger value="history" disabled>
          Histórico
        </TabsTrigger>
        <TabsTrigger value="documents" disabled>
          Documentos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
          <PatientInfoTab patientId={patientId} />
        </Suspense>
      </TabsContent>

      <TabsContent value="odontogram">
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <OdontogramTab patientId={patientId} doctors={doctors} />
        </Suspense>
      </TabsContent>

      <TabsContent value="anamnese">
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <AnamnesisTab patientId={patientId} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
