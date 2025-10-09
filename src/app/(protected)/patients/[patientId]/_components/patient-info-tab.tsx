import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Mail, Phone, User } from "lucide-react";

import { getPatientById } from "@/actions/patients/get-by-id";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function PatientInfoTab({
  patientId,
}: {
  patientId: string;
}) {
  const patient = await getPatientById({ patientId });

  if (!patient.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Paciente não encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const { data } = patient;

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
        7,
      )}`;
    }
    return phone;
  };

  const formattedDateOfBirth = format(
    new Date(data.dateOfBirth),
    "dd/MM/yyyy",
    { locale: ptBR },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Cadastrais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Informações Pessoais</h3>
            <Separator className="my-2" />
            <div className="space-y-2">
              <Badge variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                {data.email}
              </Badge>
              <Badge variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                {formatPhoneNumber(data.phoneNumber)}
              </Badge>
              <Badge variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" />
                Nascimento: {formattedDateOfBirth}
              </Badge>
              <Badge variant="outline">
                <User className="mr-2 h-4 w-4" />
                {data.sex === "male" ? "Masculino" : "Feminino"}
              </Badge>
            </div>
          </div>
          <div>
            <h3 className="font-semibold">Endereço</h3>
            <Separator className="my-2" />
            <address className="not-italic">
              {data.street}, {data.number}
              {data.complement && `, ${data.complement}`}
              <br />
              {data.neighborhood}, {data.city} - {data.state}
              <br />
              CEP: {data.zipCode}
            </address>
          </div>
        </div>
        {data.responsibleName && (
          <div>
            <h3 className="font-semibold">Responsável</h3>
            <Separator className="my-2" />
            <p>
              <strong>Nome:</strong> {data.responsibleName}
            </p>
            {data.responsibleCpf && (
              <p>
                <strong>CPF:</strong> {data.responsibleCpf}
              </p>
            )}
            {data.responsiblePhoneNumber && (
              <p>
                <strong>Telefone:</strong>{" "}
                {formatPhoneNumber(data.responsiblePhoneNumber)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
