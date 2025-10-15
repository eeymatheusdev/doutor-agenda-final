"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
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
import { appointmentStatusEnum } from "@/db/schema";
import { cn } from "@/lib/utils";

const filterSchema = z.object({
  status: z.enum(appointmentStatusEnum.enumValues).optional(),
  date: z.date().optional(),
  filterByDate: z.boolean().optional(),
});

export function AppointmentsTableFilters({
  defaultStatus,
  defaultDate,
}: {
  defaultStatus?: (typeof appointmentStatusEnum.enumValues)[number];
  defaultDate?: Date;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      status: defaultStatus || "agendada",
      date: defaultDate || new Date(),
      filterByDate: searchParams.has("date"),
    },
  });

  const { watch, handleSubmit } = form;
  const watchedStatus = watch("status");
  const watchedDate = watch("date");
  const watchedFilterByDate = watch("filterByDate");

  const isInitialMount = useRef(true);

  const onSubmit = (values: z.infer<typeof filterSchema>) => {
    const params = new URLSearchParams();
    if (values.status) {
      params.set("status", values.status);
    }
    if (values.filterByDate && values.date) {
      params.set("date", format(values.date, "yyyy-MM-dd"));
    }
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    handleSubmit(onSubmit)();
  }, [watchedStatus, watchedDate, watchedFilterByDate, handleSubmit]);

  return (
    <Form {...form}>
      <form className="flex items-end gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {appointmentStatusEnum.enumValues.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="filterByDate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 pb-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Filtrar por data</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      disabled={!watchedFilterByDate}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
