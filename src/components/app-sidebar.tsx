import React from "react";
import { LayoutDashboard, Swords, Library, PlusCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const items = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/" },
    { title: "Train", icon: Swords, path: "/train" },
    { title: "Manage Cards", icon: Library, path: "/manage" },
    { title: "Add Flashcard", icon: PlusCircle, path: "/add" },
  ];
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <Swords className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">BlunderBank</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.path}
                tooltip={item.title}
              >
                <Link to={item.path} className="flex items-center gap-3 py-6">
                  <item.icon className="h-4 w-4" />
                  <span className="font-semibold">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}