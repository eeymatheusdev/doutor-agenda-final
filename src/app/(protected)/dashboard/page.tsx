// src/app/(protected)/dashboard/page.tsx

import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getDashboard } from "@/data/get-dashboard";
import { auth } from "@/lib/auth";

import { appointmentsTableColumns } from "../appointments/_components/table-columns";
import AppointmentsChart from "./_components/appointments-chart";
import { DatePicker } from "./_components/date-picker";
import StatsCards from "./_components/stats-cards";
import TopDoctors from "./_components/top-doctors";
import TopSpecialties from "./_components/top-specialties";

interface DashboardSearchParams {
  from?: string;
  to?: string;
}

/**
 * IMPORTANT:
 * Next (v15+ / recent App Router) types `searchParams` as a Promise.
 * So the prop here must be compatible with that (Promise<...> | undefined).
 */
interface DashboardPageProps {
  searchParams?: Promise<DashboardSearchParams>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  // Resolve searchParams (await works whether next gives a Promise or a plain value at runtime)
  const resolvedSearchParams = await searchParams;
  const from =
    typeof resolvedSearchParams?.from === "string"
      ? resolvedSearchParams.from
      : undefined;
  const to =
    typeof resolvedSearchParams?.to === "string"
      ? resolvedSearchParams.to
      : undefined;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic");
  }
  if (!session.user.plan) {
    redirect("/new-subscription");
  }

  if (!from || !to) {
    redirect(
      `/dashboard?from=${dayjs().format("YYYY-MM-DD")}&to=${dayjs()
        .add(1, "month")
        .format("YYYY-MM-DD")}`,
    );
  }

  const {
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
  } = await getDashboard({
    from,
    to,
    session: {
      user: {
        clinic: {
          id: session.user.clinic.id,
        },
      },
    },
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            Tenha uma visão geral da sua clínica.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
        </PageActions>
      </PageHeader>
      <PageContent>
        <StatsCards
          totalAppointments={totalAppointments.total}
          totalPatients={totalPatients.total}
          totalDoctors={totalDoctors.total}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <AppointmentsChart dailyAppointmentsData={dailyAppointmentsData} />
          <TopDoctors doctors={topDoctors} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground" />
                <CardTitle className="text-base">
                  Agendamentos de hoje
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={appointmentsTableColumns}
                data={todayAppointments}
              />
            </CardContent>
          </Card>
          <TopSpecialties topSpecialties={topSpecialties} />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
