import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat, PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertDoctor } from "@/actions/upsert-doctor";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doctorsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

import {
  BrazilianState,
  brazilianStates,
  dentalSpecialties,
  DentalSpecialty,
} from "../_constants";

// Array de todas as chaves de estado para o Zod enum
const allBrazilianStates = Object.keys(BrazilianState) as [
  keyof typeof BrazilianState,
  ...(keyof typeof BrazilianState)[],
];

// Array de todos os valores de especialidades para o Zod array de enums
const allDentalSpecialties = Object.values(DentalSpecialty) as [
  DentalSpecialty,
  ...DentalSpecialty[],
];

const formSchema = z
  .object({
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    cro: z.string().trim().min(1, {
      message: "CRO é obrigatório.",
    }),
    email: z.string().email({
      message: "E-mail inválido.",
    }),
    dateOfBirth: z.date({
      required_error: "Data de nascimento é obrigatória.",
    }),
    rg: z.string().trim().min(1, {
      message: "RG é obrigatório.",
    }),
    cpf: z.string().trim().min(1, {
      message: "CPF é obrigatório.",
    }),
    street: z.string().trim().min(1, {
      message: "Rua é obrigatória.",
    }),
    number: z.string().trim().min(1, {
      message: "Número é obrigatório.",
    }),
    neighborhood: z.string().trim().min(1, {
      message: "Bairro é obrigatório.",
    }),
    zipCode: z.string().trim().min(1, {
      message: "CEP é obrigatório.",
    }),
    complement: z.string().optional().nullable(),
    city: z.string().trim().min(1, {
      message: "Cidade é obrigatória.",
    }),
    state: z.enum(allBrazilianStates, {
      required_error: "Estado é obrigatório.",
    }),
    observations: z.string().optional().nullable(),
    education: z.string().optional().nullable(),
    specialties: z.array(z.enum(allDentalSpecialties)).min(1, {
      message: "Selecione pelo menos uma especialidade.",
    }),
    appointmentPrice: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    availableFromWeekDay: z.string(),
    availableToWeekDay: z.string(),
    availableFromTime: z.string().min(1, {
      message: "Hora de início é obrigatória.",
    }),
    availableToTime: z.string().min(1, {
      message: "Hora de término é obrigatória.",
    }),
  })
  .refine(
    (data) => {
      return data.availableFromTime < data.availableToTime;
    },
    {
      message:
        "O horário de início não pode ser anterior ao horário de término.",
      path: ["availableToTime"],
    },
  );

// Novo tipo para o objeto doctor de entrada, pois specialties agora é um array
interface DoctorWithArraySpecialties
  extends Omit<
    typeof doctorsTable.$inferSelect,
    "specialties" | "dateOfBirth"
  > {
  specialties: DentalSpecialty[] | null;
  // CORREÇÃO: Define dateOfBirth como string | null, pois é assim que é passado para o form.
  dateOfBirth: string | null;
}

interface UpsertDoctorFormProps {
  isOpen: boolean;
  doctor?: DoctorWithArraySpecialties;
  onSuccess?: () => void;
}

// Helper para converter string de data ou null/undefined para Date | undefined
const parseDate = (dateString: string | null | undefined) =>
  dateString ? new Date(dateString) : undefined;

const UpsertDoctorForm = ({
  doctor,
  onSuccess,
  isOpen,
}: UpsertDoctorFormProps) => {
  // Define valores padrão com coerção de tipos
  const defaultValues = {
    name: doctor?.name ?? "",
    cro: doctor?.cro ?? "",
    email: doctor?.email ?? "",
    // Usa a string/null vinda do prop 'doctor', que será tratada por parseDate para inicializar o form
    dateOfBirth: parseDate(doctor?.dateOfBirth),
    rg: doctor?.rg ?? "",
    cpf: doctor?.cpf ?? "",
    street: doctor?.street ?? "",
    number: doctor?.number ?? "",
    neighborhood: doctor?.neighborhood ?? "",
    zipCode: doctor?.zipCode ?? "",
    complement: doctor?.complement ?? "",
    city: doctor?.city ?? "",
    state:
      (doctor?.state as keyof typeof BrazilianState) ??
      brazilianStates[0].value, // Define um estado padrão
    observations: doctor?.observations ?? "",
    education: doctor?.education ?? "",
    specialties: doctor?.specialties ?? [],
    appointmentPrice: doctor?.appointmentPriceInCents
      ? doctor.appointmentPriceInCents / 100
      : 0,
    availableFromWeekDay: doctor?.availableFromWeekDay?.toString() ?? "1",
    availableToWeekDay: doctor?.availableToWeekDay?.toString() ?? "5",
    availableFromTime: doctor?.availableFromTime ?? "",
    availableToTime: doctor?.availableToTime ?? "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as any, // Adicionado 'as any' temporariamente para evitar conflito de tipos de dateOfBirth com o form
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues as any);
    }
  }, [isOpen, form, doctor]);

  const upsertDoctorAction = useAction(upsertDoctor, {
    onSuccess: () => {
      toast.success("Médico salvo com sucesso.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao salvar médico.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Helper para converter string vazia para null (somente para campos opcionais)
    const nullableString = (value: string | null | undefined) =>
      value === "" ? null : value;

    upsertDoctorAction.execute({
      ...values,
      id: doctor?.id,
      availableFromWeekDay: parseInt(values.availableFromWeekDay),
      availableToWeekDay: parseInt(values.availableToWeekDay),
      appointmentPriceInCents: values.appointmentPrice * 100,
      // Apenas campos opcionais precisam de conversão
      complement: nullableString(values.complement),
      observations: nullableString(values.observations),
      education: nullableString(values.education),
    });
  };

  const selectedSpecialties = form.watch("specialties");

  // Função para gerenciar a seleção múltipla
  const handleSpecialtyChange = (value: string) => {
    const specialties = form.getValues("specialties");

    if (specialties.includes(value as DentalSpecialty)) {
      form.setValue(
        "specialties",
        specialties.filter((s) => s !== value) as DentalSpecialty[],
        { shouldValidate: true },
      );
    } else {
      form.setValue("specialties", [...specialties, value as DentalSpecialty], {
        shouldValidate: true,
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{doctor ? doctor.name : "Adicionar médico"}</DialogTitle>
        <DialogDescription>
          {doctor
            ? "Edite as informações desse médico."
            : "Adicione um novo médico."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Informações Pessoais (Nome, CRO, Email, Data de Nascimento, RG, CPF) */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CRO/CRM</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 12345/SP" {...field} />
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
                    placeholder="exemplo@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de nascimento</FormLabel>
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
                      captionLayout="dropdown-buttons"
                      selected={field.value}
                      onSelect={field.onChange}
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RG</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <PatternFormat
                    format="###.###.###-##"
                    mask="_"
                    value={field.value}
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

          {/* Endereço */}
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-semibold">Endereço</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="#####-###"
                        mask="_"
                        value={field.value}
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
                name="street"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Rua/Avenida</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        // CORREÇÃO: Garante que o valor é uma string vazia se for null/undefined
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
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
          </div>

          {/* Múltiplas Especializações */}
          <FormField
            control={form.control}
            name="specialties"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidades</FormLabel>
                <Select
                  // O valor do Select é irrelevante, usamos o onValueChange para gerenciar o array
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
                    {dentalSpecialties.map((specialty) => (
                      <SelectItem
                        key={specialty.value}
                        value={specialty.value}
                        // Marcar como selecionado visualmente
                        data-state={
                          selectedSpecialties.includes(
                            specialty.value as DentalSpecialty,
                          )
                            ? "checked"
                            : "unchecked"
                        }
                        // Prevenir fechamento do Popover ao selecionar
                        onSelect={(e) => {
                          e.preventDefault();
                          handleSpecialtyChange(specialty.value);
                        }}
                      >
                        {specialty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Visualização de tags para seleção múltipla */}
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
          {/* FIM Múltiplas Especializações */}

          {/* Formações e Observações (Opcional) */}
          <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formações (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Mestrado em Implantodontia"
                    {...field}
                    // CORREÇÃO: Garante que o valor é uma string vazia se for null/undefined
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    // CORREÇÃO: Garante que o valor é uma string vazia se for null/undefined
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Disponibilidade e Preço (existente) */}
          <FormField
            control={form.control}
            name="appointmentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço da consulta</FormLabel>
                <NumericFormat
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value.floatValue);
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  decimalSeparator=","
                  allowNegative={false}
                  allowLeadingZeros={false}
                  thousandSeparator="."
                  customInput={Input}
                  prefix="R$"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="availableFromWeekDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia inicial de disponibilidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um dia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Domingo</SelectItem>
                    <SelectItem value="1">Segunda</SelectItem>
                    <SelectItem value="2">Terça</SelectItem>
                    <SelectItem value="3">Quarta</SelectItem>
                    <SelectItem value="4">Quinta</SelectItem>
                    <SelectItem value="5">Sexta</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="availableToWeekDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia final de disponibilidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um dia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Domingo</SelectItem>
                    <SelectItem value="1">Segunda</SelectItem>
                    <SelectItem value="2">Terça</SelectItem>
                    <SelectItem value="3">Quarta</SelectItem>
                    <SelectItem value="4">Quinta</SelectItem>
                    <SelectItem value="5">Sexta</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="availableFromTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário inicial de disponibilidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Manhã</SelectLabel>
                      <SelectItem value="06:00:00">06:00</SelectItem>
                      <SelectItem value="06:30:00">06:30</SelectItem>
                      <SelectItem value="07:00:00">07:00</SelectItem>
                      <SelectItem value="07:30:00">07:30</SelectItem>
                      <SelectItem value="08:00:00">08:00</SelectItem>
                      <SelectItem value="08:30:00">08:30</SelectItem>
                      <SelectItem value="09:00:00">09:00</SelectItem>
                      <SelectItem value="09:30:00">09:30</SelectItem>
                      <SelectItem value="10:00:00">10:00</SelectItem>
                      <SelectItem value="10:30:00">10:30</SelectItem>
                      <SelectItem value="11:00:00">11:00</SelectItem>
                      <SelectItem value="11:30:00">11:30</SelectItem>
                      <SelectItem value="12:00:00">12:00</SelectItem>
                      <SelectItem value="12:30:00">12:30</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Tarde</SelectLabel>
                      <SelectItem value="13:00:00">13:00</SelectItem>
                      <SelectItem value="13:30:00">13:30</SelectItem>
                      <SelectItem value="14:00:00">14:00</SelectItem>
                      <SelectItem value="14:30:00">14:30</SelectItem>
                      <SelectItem value="15:00:00">15:00</SelectItem>
                      <SelectItem value="15:30:00">15:30</SelectItem>
                      <SelectItem value="16:00:00">16:00</SelectItem>
                      <SelectItem value="16:30:00">16:30</SelectItem>
                      <SelectItem value="17:00:00">17:00</SelectItem>
                      <SelectItem value="17:30:00">17:30</SelectItem>
                      <SelectItem value="18:00:00">18:00</SelectItem>
                      <SelectItem value="18:30:00">18:30</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Noite</SelectLabel>
                      <SelectItem value="19:00:00">19:00</SelectItem>
                      <SelectItem value="19:30:00">19:30</SelectItem>
                      <SelectItem value="20:00:00">20:00</SelectItem>
                      <SelectItem value="20:30:00">20:30</SelectItem>
                      <SelectItem value="21:00:00">21:00</SelectItem>
                      <SelectItem value="21:30:00">21:30</SelectItem>
                      <SelectItem value="22:00:00">22:00</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="availableToTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário final de disponibilidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Manhã</SelectLabel>
                      <SelectItem value="06:00:00">06:00</SelectItem>
                      <SelectItem value="06:30:00">06:30</SelectItem>
                      <SelectItem value="07:00:00">07:00</SelectItem>
                      <SelectItem value="07:30:00">07:30</SelectItem>
                      <SelectItem value="08:00:00">08:00</SelectItem>
                      <SelectItem value="08:30:00">08:30</SelectItem>
                      <SelectItem value="09:00:00">09:00</SelectItem>
                      <SelectItem value="09:30:00">09:30</SelectItem>
                      <SelectItem value="10:00:00">10:00</SelectItem>
                      <SelectItem value="10:30:00">10:30</SelectItem>
                      <SelectItem value="11:00:00">11:00</SelectItem>
                      <SelectItem value="11:30:00">11:30</SelectItem>
                      <SelectItem value="12:00:00">12:00</SelectItem>
                      <SelectItem value="12:30:00">12:30</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Tarde</SelectLabel>
                      <SelectItem value="13:00:00">13:00</SelectItem>
                      <SelectItem value="13:30:00">13:30</SelectItem>
                      <SelectItem value="14:00:00">14:00</SelectItem>
                      <SelectItem value="14:30:00">14:30</SelectItem>
                      <SelectItem value="15:00:00">15:00</SelectItem>
                      <SelectItem value="15:30:00">15:30</SelectItem>
                      <SelectItem value="16:00:00">16:00</SelectItem>
                      <SelectItem value="16:30:00">16:30</SelectItem>
                      <SelectItem value="17:00:00">17:00</SelectItem>
                      <SelectItem value="17:30:00">17:30</SelectItem>
                      <SelectItem value="18:00:00">18:00</SelectItem>
                      <SelectItem value="18:30:00">18:30</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Noite</SelectLabel>
                      <SelectItem value="19:00:00">19:00</SelectItem>
                      <SelectItem value="19:30:00">19:30</SelectItem>
                      <SelectItem value="20:00:00">20:00</SelectItem>
                      <SelectItem value="20:30:00">20:30</SelectItem>
                      <SelectItem value="21:00:00">21:00</SelectItem>
                      <SelectItem value="21:30:00">21:30</SelectItem>
                      <SelectItem value="22:00:00">22:00</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={upsertDoctorAction.isPending}>
              {upsertDoctorAction.isPending
                ? "Salvando..."
                : doctor
                  ? "Salvar"
                  : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertDoctorForm;
