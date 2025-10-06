"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertPatient } from "@/actions/upsert-patient";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

import { BrazilianState, brazilianStates } from "../../doctors/_constants";

// Array de todas as chaves de estado para o Zod enum
const allBrazilianStates = Object.keys(BrazilianState) as [
  keyof typeof BrazilianState,
  ...(keyof typeof BrazilianState)[],
];

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phoneNumber: z.string().trim().min(1, {
    message: "Número de telefone é obrigatório.",
  }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),

  // NOVOS CAMPOS OBRIGATÓRIOS DO PACIENTE
  cpf: z.string().trim().min(1, {
    message: "CPF é obrigatório.",
  }),
  rg: z.string().trim().min(1, {
    message: "RG é obrigatório.",
  }),
  dateOfBirth: z.date({
    required_error: "Data de nascimento é obrigatória.",
  }),

  // NOVOS CAMPOS DE ENDEREÇO (OBRIGATÓRIOS)
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
  city: z.string().trim().min(1, {
    message: "Cidade é obrigatória.",
  }),
  state: z.enum(allBrazilianStates, {
    required_error: "Estado é obrigatório.",
  }),

  // CAMPO DE ENDEREÇO OPCIONAL
  complement: z.string().optional().nullable(),

  // NOVOS CAMPOS DO RESPONSÁVEL (OPCIONAIS)
  responsibleName: z.string().optional().nullable(),
  responsibleCpf: z.string().optional().nullable(),
  responsibleRg: z.string().optional().nullable(),
  responsiblePhoneNumber: z.string().optional().nullable(),
});

interface UpsertPatientFormProps {
  isOpen: boolean;
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: () => void;
}

const parseDate = (dateString: string | null | undefined) =>
  dateString ? new Date(dateString) : undefined;

const UpsertPatientForm = ({
  patient,
  onSuccess,
  isOpen,
}: UpsertPatientFormProps) => {
  const defaultValues = {
    name: patient?.name ?? "",
    email: patient?.email ?? "",
    phoneNumber: patient?.phoneNumber ?? "",
    sex: patient?.sex ?? undefined,
    // DEFAULT VALUES NOVOS CAMPOS OBRIGATÓRIOS DO PACIENTE
    cpf: patient?.cpf ?? "",
    rg: patient?.rg ?? "",
    dateOfBirth: parseDate(patient?.dateOfBirth),
    // DEFAULT VALUES NOVOS CAMPOS DE ENDEREÇO
    street: patient?.street ?? "",
    number: patient?.number ?? "",
    neighborhood: patient?.neighborhood ?? "",
    zipCode: patient?.zipCode ?? "",
    city: patient?.city ?? "",
    state:
      (patient?.state as keyof typeof BrazilianState) ??
      brazilianStates[0].value,
    complement: patient?.complement ?? "",
    // DEFAULT VALUES NOVOS CAMPOS DO RESPONSÁVEL
    responsibleName: patient?.responsibleName ?? "",
    responsibleCpf: patient?.responsibleCpf ?? "",
    responsibleRg: patient?.responsibleRg ?? "",
    responsiblePhoneNumber: patient?.responsiblePhoneNumber ?? "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, form, patient]);

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: () => {
      toast.success("Paciente salvo com sucesso.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao salvar paciente.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const nullableString = (value: string | null | undefined) =>
      value === "" ? null : value;

    upsertPatientAction.execute({
      ...values,
      id: patient?.id,
      // Mapeamento dos CAMPOS OPCIONAIS do responsável/endereço para null se string vazia
      complement: nullableString(values.complement),
      responsibleName: nullableString(values.responsibleName),
      responsibleCpf: nullableString(values.responsibleCpf),
      responsibleRg: nullableString(values.responsibleRg),
      responsiblePhoneNumber: nullableString(values.responsiblePhoneNumber),
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          {patient ? patient.name : "Adicionar paciente"}
        </DialogTitle>
        <DialogDescription>
          {patient
            ? "Edite as informações desse paciente."
            : "Adicione um novo paciente."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do paciente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do paciente" {...field} />
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
                  <FormLabel>Email</FormLabel>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <PatternFormat
                      format="(##) #####-####"
                      mask="_"
                      placeholder="(11) 99999-9999"
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
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dados Pessoais Obrigatórios */}
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-semibold">Documentos</h4>
            <div className="grid grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* Endereço Obrigatório */}
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-semibold">Endereço</h4>
            <div className="grid grid-cols-3 gap-4">
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
            <div className="grid grid-cols-3 gap-4">
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
                      <Input {...field} />
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
            <div className="grid grid-cols-2 gap-4">
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

          {/* Dados do Responsável (Opcionais) */}
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-semibold">Responsável (Opcional)</h4>
            <FormField
              control={form.control}
              name="responsibleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do responsável</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="responsibleCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do responsável</FormLabel>
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
              <FormField
                control={form.control}
                name="responsibleRg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG do responsável</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsiblePhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do responsável</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="(##) #####-####"
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
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={upsertPatientAction.isPending}
              className="w-full"
            >
              {upsertPatientAction.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertPatientForm;
