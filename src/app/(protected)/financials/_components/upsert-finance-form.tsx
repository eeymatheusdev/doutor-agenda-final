// src/app/(protected)/financials/_components/upsert-finance-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, Info, Loader2 } from "lucide-react"; // Ícones relevantes
import { useAction } from "next-safe-action/hooks";
import React, { useEffect, useState } from "react";
// CORREÇÃO: Importar FieldValues para tipagem mais precisa
import { FieldValues, useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertClinicFinance } from "@/actions/clinic-finances";
import {
  ClinicFinanceSchema,
  clinicFinanceSchema,
} from "@/actions/clinic-finances/schema";
import { getPatientFinances } from "@/actions/patient-finances";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  clinicFinancesTable,
  clinicPaymentMethodsEnum,
  employeesTable,
  patientsTable,
} from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";
import { cn } from "@/lib/utils";

import {
  clinicFinancialOperations,
  clinicFinancialStatuses,
  clinicFinancialTypesInput,
  clinicFinancialTypesOutput,
} from "../index";

type FinanceEntry = typeof clinicFinancesTable.$inferSelect & {
  patient?: { id: string; name: string } | null;
  employee?: { id: string; name: string } | null;
};

type SelectOption = { id: string; name: string };

interface UpsertFinanceFormProps {
  entry?: FinanceEntry;
  onSuccess?: () => void;
  patients: SelectOption[];
  employeesAndDoctors: SelectOption[];
}

const valueToCents = (value: number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  return Math.round(value * 100);
};

const centsToValue = (cents: number | undefined | null): number => {
  if (cents === null || cents === undefined) return 0;
  return cents / 100;
};

const clinicPaymentMethods = clinicPaymentMethodsEnum.enumValues.map(
  (value) => ({
    value,
    label: value,
  }),
);

// Define o tipo explicitamente para defaultValues, garantindo que status seja do tipo correto
type FormDefaultValues = Omit<ClinicFinanceSchema, "amount"> & {
  amount: number;
};

export default function UpsertFinanceForm({
  entry,
  onSuccess,
  patients = [],
  employeesAndDoctors = [],
}: UpsertFinanceFormProps) {
  const queryClient = useQueryClient();
  const [selectedPatientCharges, setSelectedPatientCharges] = useState<
    number[]
  >(entry?.linkedPatientChargeIds ?? []);

  const initialStatus =
    entry?.status === "overdue" || entry?.status === "refunded"
      ? "pending"
      : (entry?.status ?? "pending");

  // Define os valores padrão garantindo a conformidade com ClinicFinanceSchema (especialmente 'status')
  const defaultValues: FormDefaultValues = {
    id: entry?.id,
    operation: entry?.operation ?? "input", // Fornecer um default válido se 'entry' não existir
    typeInput: entry?.typeInput ?? undefined, // Manter undefined se não aplicável inicialmente
    typeOutput: entry?.typeOutput ?? undefined, // Manter undefined se não aplicável inicialmente
    description: entry?.description ?? "",
    amount: centsToValue(entry?.amountInCents),
    paymentDate: entry?.paymentDate ? new Date(entry.paymentDate) : undefined,
    dueDate: entry?.dueDate ? new Date(entry.dueDate) : undefined,
    status: initialStatus, // Garante que status sempre tem um valor válido
    paymentMethod: entry?.paymentMethod ?? undefined, // Manter undefined se não aplicável inicialmente
    observations: entry?.observations ?? "",
    patientId: entry?.patientId ?? undefined, // Manter undefined se não aplicável inicialmente
    employeeId: entry?.employeeId ?? undefined, // Manter undefined se não aplicável inicialmente
    linkedPatientChargeIds: entry?.linkedPatientChargeIds ?? [],
  };

  const form = useForm<ClinicFinanceSchema>({
    // Usar o tipo de saída do Zod
    resolver: zodResolver(clinicFinanceSchema),
    // Fornecer defaultValues que satisfazem ClinicFinanceSchema
    defaultValues: defaultValues,
    mode: "onBlur",
  });

  const watchedOperation = form.watch("operation");
  const watchedTypeInput = form.watch("typeInput");
  const watchedTypeOutput = form.watch("typeOutput");
  const watchedPatientId = form.watch("patientId");
  const watchedStatus = form.watch("status");

  // Busca as cobranças pendentes do paciente selecionado
  const { data: patientChargesData, isLoading: isLoadingPatientCharges } =
    useQuery({
      queryKey: ["patient-charges", watchedPatientId],
      queryFn: async () => {
        if (!watchedPatientId) return [];
        const result = await getPatientFinances({
          patientId: watchedPatientId,
        });
        return (result?.data || []).filter(
          (charge) => charge.type === "charge" && charge.status !== "paid",
        );
      },
      enabled:
        !!watchedPatientId &&
        watchedOperation === "input" &&
        (watchedTypeInput === "Recebimento Consulta" ||
          watchedTypeInput === "Recebimento Procedimento" ||
          watchedTypeInput === "Recebimento Pacote"),
    });

  // Calcular valor total das cobranças selecionadas
  useEffect(() => {
    if (
      watchedOperation === "input" &&
      (watchedTypeInput === "Recebimento Consulta" ||
        watchedTypeInput === "Recebimento Procedimento" ||
        watchedTypeInput === "Recebimento Pacote") &&
      patientChargesData
    ) {
      const totalSelectedAmount = selectedPatientCharges.reduce(
        (sum, chargeId) => {
          const charge = patientChargesData.find((c) => c.id === chargeId);
          return sum + (charge?.amountInCents || 0);
        },
        0,
      );
      // Atualiza o campo de valor do formulário
      form.setValue("amount", centsToValue(totalSelectedAmount), {
        shouldValidate: true,
      });
      form.setValue("linkedPatientChargeIds", selectedPatientCharges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPatientCharges,
    patientChargesData,
    form.setValue,
    watchedOperation,
    watchedTypeInput,
  ]); // Adicionado form.setValue

  const { execute, isExecuting } = useAction(upsertClinicFinance, {
    onSuccess: () => {
      toast.success("Lançamento salvo com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["clinic-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-finance-summary"] });
      if (
        watchedPatientId &&
        watchedOperation === "input" &&
        (watchedTypeInput === "Recebimento Consulta" ||
          watchedTypeInput === "Recebimento Procedimento" ||
          watchedTypeInput === "Recebimento Pacote")
      ) {
        queryClient.invalidateQueries({
          queryKey: ["patient-finances", watchedPatientId],
        });
        queryClient.invalidateQueries({
          queryKey: ["patient-charges", watchedPatientId],
        });
      }
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      toast.error(error.error.serverError || "Erro ao salvar lançamento.");
    },
  });

  function onSubmit(values: ClinicFinanceSchema) {
    // Espera o tipo de saída
    const submitValues = {
      ...values,
      amount: Number(values.amount) || 0,
      patientId:
        values.operation === "input" && values.patientId
          ? values.patientId
          : null,
      employeeId:
        values.operation === "output" && values.employeeId
          ? values.employeeId
          : null,
      linkedPatientChargeIds:
        values.operation === "input" &&
        values.linkedPatientChargeIds &&
        values.linkedPatientChargeIds.length > 0
          ? values.linkedPatientChargeIds
          : null, // Certificar que envia null se vazio
      typeInput: values.operation === "input" ? values.typeInput : undefined,
      typeOutput: values.operation === "output" ? values.typeOutput : undefined,
      paymentMethod: values.status === "paid" ? values.paymentMethod : null,
      status: values.status, // Já deve ser válido
    };
    execute(submitValues);
  }

  const handleChargeSelection = (chargeId: number) => {
    setSelectedPatientCharges((prevSelected) => {
      if (prevSelected.includes(chargeId)) {
        return prevSelected.filter((id) => id !== chargeId);
      } else {
        return [...prevSelected, chargeId];
      }
    });
  };

  useEffect(() => {
    const resetConditionalFields = (
      operation: ClinicFinancialOperation | undefined,
    ) => {
      if (operation === "input") {
        form.setValue("typeOutput", undefined);
        form.setValue("employeeId", null);
        if (
          watchedTypeInput !== "Recebimento Consulta" &&
          watchedTypeInput !== "Recebimento Procedimento" &&
          watchedTypeInput !== "Recebimento Pacote" &&
          watchedTypeInput !== "Crédito/Adiantamento Paciente"
        ) {
          form.setValue("patientId", null);
          form.setValue("linkedPatientChargeIds", []);
          setSelectedPatientCharges([]);
        }
      } else if (operation === "output") {
        form.setValue("typeInput", undefined);
        form.setValue("patientId", null);
        form.setValue("linkedPatientChargeIds", []);
        setSelectedPatientCharges([]);
        if (watchedTypeOutput !== "Pagamento Funcionário") {
          form.setValue("employeeId", null);
        }
      } else {
        form.setValue("typeInput", undefined);
        form.setValue("typeOutput", undefined);
        form.setValue("patientId", null);
        form.setValue("employeeId", null);
        form.setValue("linkedPatientChargeIds", []);
        setSelectedPatientCharges([]);
      }
    };
    resetConditionalFields(watchedOperation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedOperation, form.setValue]); // watchedTypeInput/Output removidos para evitar loops indesejados

  useEffect(() => {
    if (watchedOperation === "input") {
      if (
        watchedTypeInput !== "Recebimento Consulta" &&
        watchedTypeInput !== "Recebimento Procedimento" &&
        watchedTypeInput !== "Recebimento Pacote" &&
        watchedTypeInput !== "Crédito/Adiantamento Paciente" &&
        form.getValues("patientId") // Só limpa se não for um tipo relacionado a paciente
      ) {
        form.setValue("patientId", null);
        form.setValue("linkedPatientChargeIds", []);
        setSelectedPatientCharges([]);
      } else if (watchedTypeInput === "Crédito/Adiantamento Paciente") {
        // Se for crédito, limpa apenas os linked charges, mantém patientId
        form.setValue("linkedPatientChargeIds", []);
        setSelectedPatientCharges([]);
      }
    } else if (watchedOperation === "output") {
      if (
        watchedTypeOutput !== "Pagamento Funcionário" &&
        form.getValues("employeeId")
      ) {
        // Só limpa se não for pagamento de funcionário
        form.setValue("employeeId", null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTypeInput, watchedTypeOutput, form.setValue, watchedOperation]); // Adicionado form.getValues

  const availableStatuses = clinicFinancialStatuses.filter(
    (s) => s.value !== "overdue" && s.value !== "refunded",
  );

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          {entry ? "Editar Lançamento" : "Adicionar Lançamento"}
        </DialogTitle>
        <DialogDescription>
          Preencha os detalhes da transação financeira da clínica.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-h-[70vh] space-y-4 overflow-y-auto pr-4 pl-1"
        >
          {/* Operação (Entrada/Saída) */}
          <FormField
            control={form.control}
            name="operation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operação</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  // CORREÇÃO: Usar valor do field, default já tratado no useForm
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a operação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clinicFinancialOperations.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo (Condicional à Operação) */}
          {watchedOperation === "input" && (
            <FormField
              control={form.control}
              name="typeInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Entrada</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de entrada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clinicFinancialTypesInput.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchedOperation === "output" && (
            <FormField
              control={form.control}
              name="typeOutput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Saída</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de saída" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clinicFinancialTypesOutput.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Select de Funcionário/Médico (Condicional) */}
          {watchedOperation === "output" &&
            watchedTypeOutput === "Pagamento Funcionário" && (
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário / Médico</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário/médico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeesAndDoctors.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

          {/* Select de Paciente (Condicional) */}
          {watchedOperation === "input" &&
            (watchedTypeInput === "Recebimento Consulta" ||
              watchedTypeInput === "Recebimento Procedimento" ||
              watchedTypeInput === "Recebimento Pacote" ||
              watchedTypeInput === "Crédito/Adiantamento Paciente") && (
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((pat) => (
                          <SelectItem key={pat.id} value={pat.id}>
                            {pat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

          {/* Seleção de Cobranças do Paciente (Condicional) */}
          {watchedOperation === "input" &&
            (watchedTypeInput === "Recebimento Consulta" ||
              watchedTypeInput === "Recebimento Procedimento" ||
              watchedTypeInput === "Recebimento Pacote") &&
            watchedPatientId && (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Cobranças Pendentes/Vencidas do Paciente
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <Info className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Selecione as cobranças que este recebimento irá
                          quitar. O valor total será calculado automaticamente.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <ScrollArea className="h-32 w-full rounded-md border p-2">
                  {isLoadingPatientCharges && (
                    <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" />
                  )}
                  {!isLoadingPatientCharges &&
                    patientChargesData &&
                    patientChargesData.length === 0 && (
                      <p className="text-muted-foreground text-center text-sm">
                        Nenhuma cobrança pendente/vencida encontrada.
                      </p>
                    )}
                  {!isLoadingPatientCharges &&
                    patientChargesData &&
                    patientChargesData.length > 0 && (
                      <div className="space-y-2">
                        {patientChargesData.map((charge) => (
                          <div
                            key={charge.id}
                            className="hover:bg-muted/50 flex items-center justify-between rounded-sm p-1"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`charge-${charge.id}`}
                                checked={selectedPatientCharges.includes(
                                  charge.id,
                                )}
                                onCheckedChange={() =>
                                  handleChargeSelection(charge.id)
                                }
                              />
                              <Label
                                htmlFor={`charge-${charge.id}`}
                                className="cursor-pointer text-sm font-normal"
                              >
                                {charge.description || "Cobrança sem descrição"}{" "}
                                - {formatCurrencyInCents(charge.amountInCents)}
                                {charge.dueDate &&
                                  ` (Venc: ${format(new Date(charge.dueDate), "dd/MM/yy")})`}
                                <span
                                  className={cn(
                                    "ml-2 text-xs font-semibold",
                                    charge.status === "overdue"
                                      ? "text-destructive"
                                      : "text-amber-600",
                                  )}
                                >
                                  (
                                  {charge.status === "overdue"
                                    ? "Vencida"
                                    : "Pendente"}
                                  )
                                </span>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </ScrollArea>
                {/* Exibir mensagem de erro do Zod para linkedPatientChargeIds se houver */}
                <FormField
                  control={form.control}
                  name="linkedPatientChargeIds"
                  render={() => <FormMessage />}
                />
              </FormItem>
            )}

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalhes da transação..."
                    {...field}
                    value={field.value ?? ""} // Garantir que não seja null
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    value={field.value}
                    onValueChange={(values) =>
                      field.onChange(values.floatValue ?? 0)
                    }
                    disabled={
                      watchedOperation === "input" &&
                      (watchedTypeInput === "Recebimento Consulta" ||
                        watchedTypeInput === "Recebimento Procedimento" ||
                        watchedTypeInput === "Recebimento Pacote") &&
                      selectedPatientCharges.length > 0
                    }
                  />
                </FormControl>
                {watchedOperation === "input" &&
                  (watchedTypeInput === "Recebimento Consulta" ||
                    watchedTypeInput === "Recebimento Procedimento" ||
                    watchedTypeInput === "Recebimento Pacote") &&
                  selectedPatientCharges.length > 0 && (
                    <FormDescription>
                      O valor é calculado com base nas cobranças selecionadas.
                    </FormDescription>
                  )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Data Pagamento/Recebimento (Obrigatório se pago) */}
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Pagamento/Recebimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data Vencimento (Opcional) */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    {" "}
                    {/* Agora seguro */}
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                      {/* Mostrar status original se for Vencido ou Estornado */}
                      {entry?.status &&
                        (entry.status === "overdue" ||
                          entry.status === "refunded") &&
                        entry.status === field.value && ( // Mostra apenas se for o valor atual
                          <SelectItem value={entry.status} disabled>
                            {entry.status === "overdue"
                              ? "Vencido"
                              : "Estornado"}
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forma de Pagamento (Condicional ao Status 'Pago') */}
            {watchedStatus === "paid" && (
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clinicPaymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Observações */}
          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Informações adicionais..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={isExecuting}>
              {isExecuting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
