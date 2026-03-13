import React from "react";
import { LayoutDashboard, Swords, Library, PlusCircle, LogOut, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/auth";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const logoutAction = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);
  const items = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/" },
    { title: "Train", icon: Swords, path: "/train" },
    { title: "Manage Cards", icon: Library, path: "/manage" },
    { title: "Add Flashcard", icon: PlusCircle, path: "/add" },
  ];
  const handleLogout = () => {
    logoutAction();
    navigate('/login');
  };
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
      <SidebarFooter className="p-4 border-t border-border/40">
        <SidebarMenu>
          {user && (
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-muted/40 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-black truncate">{user.username}</span>
                  <span className="text-[10px] text-muted-foreground">Active Session</span>
                </div>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/5 font-bold transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}