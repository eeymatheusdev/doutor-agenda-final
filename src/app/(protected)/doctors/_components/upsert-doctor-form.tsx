"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"; // Importe o plugin UTC se for usar UTC
import { CalendarIcon, XIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

// Não precisa do plugin UTC para esta correção específica
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
import { Separator } from "@/components/ui/separator";
import { doctorsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

import {
  BrazilianState,
  brazilianStates,
  dentalSpecialties,
  DentalSpecialty,
} from "../_constants";

dayjs.extend(utc);
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
    avatarImageUrl: z
      .string()
      .url("URL inválida.")
      .or(z.literal(""))
      .optional()
      .nullable(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    cro: z.string().trim().min(1, {
      message: "CRO é obrigatório.",
    }),
    rg: z.string().trim().min(1, {
      message: "RG é obrigatório.",
    }),
    cpf: z.string().trim().min(1, {
      message: "CPF é obrigatório.",
    }),
    dateOfBirth: z.date({
      required_error: "Data de nascimento é obrigatória.",
    }),
    email: z.string().email({
      message: "E-mail inválido.",
    }),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Telefone inválido")
      .optional()
      .nullable(),
    whatsApp: z
      .string()
      .regex(/^\d{11}$/, "WhatsApp inválido")
      .optional()
      .nullable(),
    specialties: z.array(z.enum(allDentalSpecialties)).min(1, {
      message: "Selecione pelo menos uma especialidade.",
    }),
    observations: z.string().optional().nullable(),
    education: z.string().optional().nullable(),
    availableFromWeekDay: z.string(),
    availableToWeekDay: z.string(),
    availableFromTime: z.string().min(1, {
      message: "Hora de início é obrigatória.",
    }),
    availableToTime: z.string().min(1, {
      message: "Hora de término é obrigatória.",
    }),
    addressStreet: z.string().trim().min(1, "Rua/Avenida é obrigatória."),
    addressNumber: z.string().trim().min(1, "Número é obrigatório."),
    addressComplement: z.string().optional().nullable(),
    addressNeighborhood: z.string().trim().min(1, "Bairro é obrigatório."),
    addressCity: z.string().trim().min(1, "Cidade é obrigatória."),
    addressState: z.enum(allBrazilianStates, {
      required_error: "Estado é obrigatório.",
    }),
    addressZipcode: z.string().regex(/^\d{8}$/, "CEP inválido"),
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

interface DoctorWithArraySpecialties
  extends Omit<
    typeof doctorsTable.$inferSelect,
    "specialties" | "dateOfBirth"
  > {
  specialties: DentalSpecialty[] | null;
  dateOfBirth: string | null;
}

interface UpsertDoctorFormProps {
  isOpen: boolean;
  doctor?: DoctorWithArraySpecialties;
  onSuccess?: () => void;
}

const parseDate = (dateString: string | null | undefined) => {
  if (!dateString) return undefined;

  // Cria um objeto Date a partir da string de data recebida.
  const date = new Date(dateString);

  // getTimezoneOffset() retorna a diferença em minutos entre o UTC e a hora local.
  // Para o Brasil (GMT-3), o valor é 180.
  const timezoneOffset = date.getTimezoneOffset();

  // Adicionamos os minutos do offset de volta à data.
  // Isso efetivamente converte a data de volta para o horário UTC,
  // corrigindo o deslocamento de um dia.
  date.setMinutes(date.getMinutes() + timezoneOffset);

  return date;
};

const UpsertDoctorForm = ({
  doctor,
  onSuccess,
  isOpen,
}: UpsertDoctorFormProps) => {
  const defaultValues = {
    avatarImageUrl: doctor?.avatarImageUrl ?? "",
    name: doctor?.name ?? "",
    cro: doctor?.cro ?? "",
    rg: doctor?.rg ?? "",
    cpf: doctor?.cpf ?? "",
    dateOfBirth: parseDate(doctor?.dateOfBirth),
    email: doctor?.email ?? "",
    phone: doctor?.phone ?? "",
    whatsApp: doctor?.whatsApp ?? "",
    specialties: (doctor?.specialties as any) ?? [],
    observations: doctor?.observations ?? "",
    education: doctor?.education ?? "",
    availableFromWeekDay: doctor?.availableFromWeekDay?.toString() ?? "1",
    availableToWeekDay: doctor?.availableToWeekDay?.toString() ?? "5",
    availableFromTime: doctor?.availableFromTime ?? "",
    availableToTime: doctor?.availableToTime ?? "",
    addressStreet: doctor?.addressStreet ?? "",
    addressNumber: doctor?.addressNumber ?? "",
    addressComplement: doctor?.addressComplement ?? "",
    addressNeighborhood: doctor?.addressNeighborhood ?? "",
    addressCity: doctor?.addressCity ?? "",
    addressState: (doctor?.addressState as any) ?? undefined,
    addressZipcode: doctor?.addressZipcode ?? "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as any,
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
    const nullableString = (value: string | null | undefined) =>
      value === "" ? null : value;

    upsertDoctorAction.execute({
      ...values,
      id: doctor?.id,
      avatarImageUrl: nullableString(values.avatarImageUrl),
      phone: nullableString(values.phone),
      whatsApp: nullableString(values.whatsApp),
      observations: nullableString(values.observations),
      education: nullableString(values.education),
      addressComplement: nullableString(values.addressComplement),
    });
  };

  const selectedSpecialties = form.watch("specialties");

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
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{doctor ? doctor.name : "Adicionar médico"}</DialogTitle>
        <DialogDescription>
          {doctor
            ? "Edite as informações desse médico."
            : "Adicione um novo médico."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-h-[70vh] space-y-6 overflow-y-auto px-1 pr-4"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Pessoais</h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
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
              name="email"
              render={({ field }) => (
                <FormItem className="col-span-2">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="###.###.###-##"
                        mask="_"
                        placeholder="000.000.000-00"
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
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="##.###.###-#"
                        mask="_"
                        placeholder="00.000.000-0"
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
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento</FormLabel>
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
                              format(field.value, "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Selecione</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsApp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="(##) ####-####"
                        mask="_"
                        placeholder="(11) 9999-9999"
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
            </div>
          </div>

          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold">Endereço</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="addressNeighborhood"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Bairro</FormLabel>
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
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="addressCity"
                render={({ field }) => (
                  <FormItem className="col-span-2">
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
                  <FormItem className="col-span-1">
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="SP" />
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
              <FormField
                control={form.control}
                name="addressZipcode"
                render={({ field }) => (
                  <FormItem className="col-span-1">
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
            </div>
          </div>

          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Especialidades e Disponibilidade
            </h3>
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades</FormLabel>
                  <Select
                    onValueChange={handleSpecialtyChange}
                    value={
                      selectedSpecialties.length > 0
                        ? selectedSpecialties[0]
                        : ""
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
                          data-state={
                            selectedSpecialties.includes(
                              specialty.value as DentalSpecialty,
                            )
                              ? "checked"
                              : "unchecked"
                          }
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="availableFromWeekDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponível de</FormLabel>
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
                    <FormLabel>Até</FormLabel>
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
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="availableFromTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Das</FormLabel>
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
                    <FormLabel>Até</FormLabel>
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
            </div>
          </div>

          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Adicionais</h3>
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
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Foto (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="URL da Foto do médico"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={upsertDoctorAction.isPending}>
              {upsertDoctorAction.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {doctor ? "Salvando..." : "Criando..."}
                </>
              ) : doctor ? (
                "Salvar Alterações"
              ) : (
                "Adicionar Médico"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertDoctorForm;
