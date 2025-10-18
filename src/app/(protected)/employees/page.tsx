// src/app/(protected)/employees/page.tsx
import { eq } from "drizzle-orm";
import { Users } from "lucide-react"; // Ícone para funcionários
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { employeesTable } from "@/db/schema"; // Importa a nova tabela
import { auth } from "@/lib/auth";

import AddEmployeeButton from "./_components/add-employee-button"; // Importa o novo botão
import EmployeeCard, { Employee } from "./_components/employee-card"; // Importa o novo card

const EmployeesPage = async () => {
  // Renomeado para EmployeesPage
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.plan) {
    redirect("/new-subscription");
  }
  if (!session.user.clinic) {
    redirect("/clinic");
  }
  const employees = await db.query.employeesTable.findMany({
    // Busca na tabela de funcionários
    where: eq(employeesTable.clinicId, session.user.clinic.id),
  });

  // Adapta os dados, convertendo dateOfBirth para Date
  const adaptedEmployees: Employee[] = employees.map((employee) => ({
    ...employee,
    dateOfBirth: new Date(employee.dateOfBirth),
  })) as Employee[]; // O cast para Employee ainda funciona pois role já é array

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Funcionários</PageTitle> {/* Título da página */}
          <PageDescription>
            Gerencie os funcionários da sua clínica
          </PageDescription>{" "}
          {/* Descrição */}
        </PageHeaderContent>
        <PageActions>
          <AddEmployeeButton /> {/* Usa o novo botão */}
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Mapeia e renderiza os cards de funcionários */}
          {adaptedEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default EmployeesPage; // Exporta a nova página
