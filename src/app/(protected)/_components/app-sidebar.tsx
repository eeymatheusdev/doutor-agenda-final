// eeymatheusdev/doutor-agenda-final/doutor-agenda-final-c7f670c00b38f056215f1fa2b1f490cb43ea870a/src/app/(protected)/_components/app-sidebar.tsx

"use client";

import {
  CalendarDays,
  Gem,
  LayoutDashboard,
  LogOut,
  Settings, // Importa Settings para uso futuro/direto
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { DollarSign } from "lucide-react"; // Novo ícone
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditClinicDialog } from "@/components/ui/clinic/edit-clinic-dialog"; // NOVO IMPORT
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

const items = [
  // ... itens existentes
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: CalendarDays,
  },
  {
    title: "Médicos",
    url: "/doctors",
    icon: Stethoscope,
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: UsersRound,
  },
  {
    // Novo item
    title: "Financeiro",
    url: "/financials",
    icon: DollarSign,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const session = authClient.useSession();
  const pathname = usePathname();

  const handleSignOut = async () => {
    // ... lógica de logout
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Image
          src="/logofundotransparente.png"
          alt="Doutor Agenda"
          width={136}
          height={28}
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
        <div className="flex w-full items-center justify-between">
          {/* Menu de Usuário/Clínica */}
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="flex-1">
                    {" "}
                    {/* Adicionado flex-1 */}
                    <Avatar>
                      <AvatarFallback>
                        {session.data?.user.name
                          ? session.data.user.name[0]
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden text-left">
                      {" "}
                      {/* Adicionado overflow-hidden */}
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
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Botão de Edição da Clínica */}
          {session.data?.user?.clinic?.id && (
            <div className="flex h-12 items-center justify-center pl-2">
              {" "}
              {/* Container para alinhar com o botão da sidebar */}
              <EditClinicDialog />
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
