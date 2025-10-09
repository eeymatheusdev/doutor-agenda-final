"use client";

import { Loader2, Settings } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { getClinic } from "@/actions/clinic/get-clinic";
import UpsertClinicForm from "@/app/(protected)/clinics/_components/upsert-clinic-form"; // Criação futura
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Tipo de dados esperado (mantido inalterado)
export interface ClinicData {
  id: string;
  name: string;
  cnpj: string | null;
  inscricaoEstadual: string | null;
  responsibleName: string | null;
  croResponsavel: string | null;
  specialties: string[] | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipcode: string | null;
  googleMapsUrl: string | null;
  openingHours: Record<string, string> | null;
  paymentMethods: string[] | null;
  logoUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function EditClinicDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [clinicData, setClinicData] = React.useState<ClinicData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { isMobile, state } = useSidebar();

  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setIsLoading(true);
      try {
        const result = await getClinic();

        // Verifica se 'result' existe e se a chave 'data' está presente (indicador de sucesso)
        if (result && "data" in result) {
          setClinicData(result.data as ClinicData);
        } else {
          toast.error(
            "Erro ao carregar dados da clínica: falha na comunicação ou não autorizado.",
          );
          setIsOpen(false);
          setClinicData(null);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados da clínica.");
        setIsOpen(false);
        setClinicData(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isCollapsed = state === "collapsed" && !isMobile;

  // SIMPLIFICAÇÃO: O ButtonContent não precisa de lógica de tooltip;
  // o wrapper <Tooltip> já cuida disso.
  const ButtonContent = (
    <Button variant="ghost" size="icon" disabled={isLoading}>
      <Settings className="size-4" />
      <span className="sr-only">Editar Clínica</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>
          {/* O DialogTrigger envolve o botão */}
          <DialogTrigger asChild>{ButtonContent}</DialogTrigger>
        </TooltipTrigger>
        {/* O TooltipContent aparece apenas quando a sidebar está colapsada no desktop */}
        <TooltipContent side="right" hidden={!isCollapsed}>
          Editar Clínica
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {clinicData?.name ? `Editar ${clinicData.name}` : "Carregando..."}
          </DialogTitle>
          <DialogDescription>
            Atualize as informações administrativas e de contato da sua clínica.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : clinicData ? (
          <UpsertClinicForm
            clinicData={clinicData}
            onSuccess={() => handleOpen(false)}
          />
        ) : (
          <p className="text-destructive">
            Não foi possível carregar os dados.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
