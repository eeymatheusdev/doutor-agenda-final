// src/app/(protected)/patients/[patientId]/_components/patient-info-tab.tsx
"use client"; // Needs to be client component to use the form

import { useQuery } from "@tanstack/react-query"; // Use useQuery for client-side fetching
import { Loader2 } from "lucide-react";
import * as React from "react";

import { getPatientById } from "@/actions/patients/get-by-id"; // Action to fetch data
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Import the form component
import UpsertPatientForm from "../../_components/upsert-patient-form";

export default function PatientInfoTab({ patientId }: { patientId: string }) {
  const [isFormOpen, setIsFormOpen] = React.useState(true); // Always open in this context

  // Fetch patient data client-side using React Query and the server action
  const { data: patientResult, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientById({ patientId }),
    enabled: !!patientId, // Only run query if patientId is available
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados do paciente...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patientResult || !patientResult.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Paciente não encontrado ou erro ao carregar os dados.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render the UpsertPatientForm directly
  return (
    // Wrap form in a Card for consistent styling if needed, or remove Card
    // <Card>
    //   <CardHeader>
    //     <CardTitle>Dados Cadastrais</CardTitle>
    //   </CardHeader>
    //   <CardContent>
    <UpsertPatientForm
      patient={patientResult.data}
      isOpen={isFormOpen} // Keep form always "open" within the tab
      // Optional: Add an onSuccess handler if needed after saving within the tab
      // onSuccess={() => console.log("Patient updated")}
    />
    //   </CardContent>
    // </Card>
  );
}
