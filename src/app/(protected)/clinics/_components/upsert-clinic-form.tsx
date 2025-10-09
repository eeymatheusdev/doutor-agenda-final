// src/app/(protected)/clinics/_components/upsert-clinic-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings, XIcon } from "lucide-react"; // <--- AQUI
import { useAction } from "next-safe-action/hooks";
import * as React from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import {
  UpdateClinicSchema,
  updateClinicSchema,
} from "@/actions/clinic/schema";
import { updateClinic } from "@/actions/clinic/update-clinic";
import { Button } from "@/components/ui/button";
import { ClinicData } from "@/components/ui/clinic/edit-clinic-dialog"; // Importa o tipo
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { brazilianStates, dentalSpecialties } from "../../doctors/_constants";

interface UpsertClinicFormProps {
  clinicData: ClinicData;
  onSuccess?: () => void;
}

// Helper para converter string vazia para null (aplica a lógica DRY)
const nullableString = (value: string | null | undefined) =>
  value === "" ? null : value;

const UpsertClinicForm = ({ clinicData, onSuccess }: UpsertClinicFormProps) => {
  // Converte a lista de especialidades para o formato de formulário (string[])
  const defaultSpecialties = clinicData.specialties?.map((s) => s) ?? [];
  const defaultPaymentMethods = clinicData.paymentMethods?.map((p) => p) ?? [];

  const defaultValues: UpdateClinicSchema = {
    id: clinicData.id,
    name: clinicData.name ?? "",
    cnpj: clinicData.cnpj ?? "",
    inscricaoEstadual: clinicData.inscricaoEstadual ?? "",
    responsibleName: clinicData.responsibleName ?? "",
    croResponsavel: clinicData.croResponsavel ?? "",
    specialties:
      defaultSpecialties.length > 0 ? (defaultSpecialties as any) : undefined,
    phone: clinicData.phone ?? "",
    email: clinicData.email ?? "",
    website: clinicData.website ?? "",
    addressStreet: clinicData.addressStreet ?? "",
    addressNumber: clinicData.addressNumber ?? "",
    addressComplement: clinicData.addressComplement ?? "",
    addressNeighborhood: clinicData.addressNeighborhood ?? "",
    addressCity: clinicData.addressCity ?? "",
    addressState: (clinicData.addressState as any) ?? undefined,
    addressZipcode: clinicData.addressZipcode ?? "",
    googleMapsUrl: clinicData.googleMapsUrl ?? "",
    openingHours: clinicData.openingHours ?? undefined,
    paymentMethods:
      defaultPaymentMethods.length > 0 ? defaultPaymentMethods : undefined,
    logoUrl: clinicData.logoUrl ?? "",
    notes: clinicData.notes ?? "",
  };

  const form = useForm<UpdateClinicSchema>({
    resolver: zodResolver(updateClinicSchema),
    defaultValues: defaultValues as any,
  });

  const updateClinicAction = useAction(updateClinic, {
    onSuccess: () => {
      toast.success("Dados da clínica atualizados com sucesso.");
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar dados da clínica.");
    },
  });

  const onSubmit = (values: UpdateClinicSchema) => {
    // Coerção para null de strings vazias para campos opcionais
    const transformedValues: UpdateClinicSchema = {
      ...values,
      cnpj: nullableString(values.cnpj),
      inscricaoEstadual: nullableString(values.inscricaoEstadual),
      responsibleName: nullableString(values.responsibleName),
      croResponsavel: nullableString(values.croResponsavel),
      phone: nullableString(values.phone),
      email: nullableString(values.email),
      website: nullableString(values.website),
      addressComplement: nullableString(values.addressComplement),
      addressZipcode: nullableString(values.addressZipcode),
      googleMapsUrl: nullableString(values.googleMapsUrl),
      logoUrl: nullableString(values.logoUrl),
      notes: nullableString(values.notes),
      // Transforma arrays vazios (provenientes de umselected no multi-select) para undefined se for opcional
      specialties:
        values.specialties && values.specialties.length > 0
          ? values.specialties
          : null,
      paymentMethods:
        values.paymentMethods && values.paymentMethods.length > 0
          ? values.paymentMethods
          : null,
    };

    updateClinicAction.execute(transformedValues);
  };

  const selectedSpecialties = form.watch("specialties") ?? [];

  // Função para gerenciar a seleção múltipla de especialidades
  const handleSpecialtyChange = (value: string) => {
    const specialties = form.getValues("specialties") || [];
    const specialtyValue = value as (typeof dentalSpecialties)[number]["value"];

    if (specialties.includes(specialtyValue)) {
      form.setValue(
        "specialties",
        specialties.filter((s) => s !== specialtyValue) as any,
        { shouldValidate: true },
      );
    } else {
      form.setValue("specialties", [...specialties, specialtyValue] as any, {
        shouldValidate: true,
      });
    }
  };

  const availablePaymentMethods = [
    { value: "cartao", label: "Cartão de Crédito/Débito" },
    { value: "pix", label: "PIX" },
    { value: "boleto", label: "Boleto" },
    { value: "dinheiro", label: "Dinheiro" },
  ];

  const selectedPaymentMethods = form.watch("paymentMethods") ?? [];

  // Função para gerenciar a seleção múltipla de métodos de pagamento
  const handlePaymentMethodChange = (value: string) => {
    const paymentMethods = form.getValues("paymentMethods") || [];

    if (paymentMethods.includes(value)) {
      form.setValue(
        "paymentMethods",
        paymentMethods.filter((p) => p !== value),
        { shouldValidate: true },
      );
    } else {
      form.setValue("paymentMethods", [...paymentMethods, value], {
        shouldValidate: true,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-6 overflow-y-auto px-1 pr-4" // Adiciona scroll ao formulário
      >
        {/* ======================= DADOS GERAIS ======================= */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="size-5" />
            Dados Gerais
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Clínica (Obrigatório)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <PatternFormat
                      format="##.###.###/####-##"
                      mask="_"
                      placeholder="00.000.000/0000-00"
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value.value);
                      }}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inscricaoEstadual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição Estadual</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ======================= RESPONSÁVEL TÉCNICO ======================= */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Responsável Técnico</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="responsibleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Responsável</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="croResponsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRO do Responsável</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 12345/SP"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ======================= ESPECIALIDADES (Múltipla Seleção) ======================= */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Especialidades da Clínica</h3>
          <FormField
            control={form.control}
            name="specialties"
            render={() => (
              <FormItem>
                <FormLabel>Selecione as especialidades oferecidas</FormLabel>
                <Select
                  onValueChange={handleSpecialtyChange}
                  value={
                    selectedSpecialties.length > 0 ? selectedSpecialties[0] : ""
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione as especialidades" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Especialidades Odontológicas</SelectLabel>
                      {dentalSpecialties.map((specialty) => (
                        <SelectItem
                          key={specialty.value}
                          value={specialty.value}
                          data-state={
                            selectedSpecialties.includes(specialty.value)
                              ? "checked"
                              : "unchecked"
                          }
                          // Impede o fechamento do Select ao selecionar um item
                          onSelect={(e) => e.preventDefault()}
                        >
                          {specialty.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedSpecialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedSpecialties.map((specialty) => (
                      <Button
                        key={specialty}
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => handleSpecialtyChange(specialty)}
                        className="h-7"
                      >
                        {specialty}
                        <XIcon className="ml-1 size-3" />
                      </Button>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ======================= CONTATO E ENDEREÇO ======================= */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contato e Endereço</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <PatternFormat
                      format="(##) #####-####"
                      mask="_"
                      placeholder="(11) 99999-9999"
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value.value);
                      }}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contato@clinica.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Website (URL)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.suaclinica.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="addressZipcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <PatternFormat
                      format="#####-###"
                      mask="_"
                      placeholder="00000-000"
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value.value);
                      }}
                      customInput={Input}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressStreet"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Rua/Avenida</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="addressNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressComplement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressNeighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="addressCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o Estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="googleMapsUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Google Maps</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL do Google Maps"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ======================= INFORMAÇÕES ADMINISTRATIVAS ======================= */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações Administrativas</h3>

          <FormField
            control={form.control}
            name="paymentMethods"
            render={() => (
              <FormItem>
                <FormLabel>Métodos de Pagamento Aceitos</FormLabel>
                <Select
                  onValueChange={handlePaymentMethodChange}
                  value={
                    selectedPaymentMethods.length > 0
                      ? selectedPaymentMethods[0]
                      : ""
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione os métodos de pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Métodos</SelectLabel>
                      {availablePaymentMethods.map((method) => (
                        <SelectItem
                          key={method.value}
                          value={method.value}
                          data-state={
                            selectedPaymentMethods.includes(method.value)
                              ? "checked"
                              : "unchecked"
                          }
                          onSelect={(e) => e.preventDefault()}
                        >
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedPaymentMethods.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedPaymentMethods.map((method) => (
                      <Button
                        key={method}
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => handlePaymentMethodChange(method)}
                        className="h-7"
                      >
                        {
                          availablePaymentMethods.find(
                            (m) => m.value === method,
                          )?.label
                        }
                        <XIcon className="ml-1 size-3" />
                      </Button>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do Logo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="URL do logo da clínica"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Internas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações internas sobre a clínica."
                    {...field}
                    value={field.value ?? ""}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={updateClinicAction.isPending}>
            {updateClinicAction.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default UpsertClinicForm;
