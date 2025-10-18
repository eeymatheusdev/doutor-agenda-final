"use client";

import {
  CalendarDays,
  DollarSign,
  Gem,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  Users,
  UsersRound,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { getClinic } from "@/actions/clinic/get-clinic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

import UpsertClinicForm, {
  ClinicData,
} from "../clinic/_components/upsert-clinic-form";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agendamentos", url: "/appointments", icon: CalendarDays },
  { title: "Médicos", url: "/doctors", icon: Stethoscope },
  { title: "Pacientes", url: "/patients", icon: UsersRound },
  { title: "Funcionários", url: "/employees", icon: Users },
  { title: "Financeiro", url: "/financials", icon: DollarSign },
];

export function AppSidebar() {
  const router = useRouter();
  const session = authClient.useSession();
  const pathname = usePathname();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [clinicData, setClinicData] = React.useState<ClinicData | null>(null);
  const [isLoadingClinic, setIsLoadingClinic] = React.useState(false);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/authentication"),
      },
    });
  };

  const handleOpenEditDialog = async (open: boolean) => {
    setIsEditDialogOpen(open);
    if (open && !clinicData) {
      setIsLoadingClinic(true);
      try {
        const result = await getClinic();
        if (result && "data" in result) {
          setClinicData(result.data as ClinicData);
        } else {
          toast.error("Erro ao carregar dados da clínica.");
          setIsEditDialogOpen(false);
        }
      } catch (error) {
        toast.error("Erro ao carregar dados da clínica.");
        setIsEditDialogOpen(false);
      } finally {
        setIsLoadingClinic(false);
      }
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Image
          src="/logofundotransparente.png"
          alt="Doutor Agenda"
          width={613}
          height={125}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Outros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/subscription"}
                >
                  <Link href="/subscription">
                    <Gem />
                    <span>Assinatura</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Dialog open={isEditDialogOpen} onOpenChange={handleOpenEditDialog}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="w-full">
                <Avatar>
                  <AvatarImage
                    src={session.data?.user.clinic?.logoUrl || ""}
                    alt={session.data?.user.clinic?.name || "Logo"}
                  />
                  <AvatarFallback>
                    {session.data?.user.clinic?.name?.[0] ?? "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden text-left">
                  <p className="truncate text-sm">
                    {session.data?.user?.clinic?.name || "Sem Clínica"}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {session.data?.user.email}
                  </p>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {session.data?.user?.clinic?.id && (
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Settings className="mr-2 size-4" />
                    Editar Clínica
                  </DropdownMenuItem>
                </DialogTrigger>
              )}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {clinicData?.name
                  ? `Editar ${clinicData.name}`
                  : "Carregando..."}
              </DialogTitle>
              <DialogDescription>
                Atualize as informações da sua clínica.
              </DialogDescription>
            </DialogHeader>
            {isLoadingClinic ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : clinicData ? (
              <UpsertClinicForm
                clinicData={clinicData}
                onSuccess={() => handleOpenEditDialog(false)}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
