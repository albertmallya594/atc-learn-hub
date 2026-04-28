import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Home, MessageSquareQuote, Tag, Users, ShieldCheck, BookOpen, Bell, User, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import atcLogo from "@/assets/atc-logo.png";

interface Category { id: string; name: string; slug: string; }

const main = [
  { title: "Home", url: "/", icon: Home },
  { title: "Questions", url: "/questions", icon: MessageSquareQuote },
  { title: "Tags", url: "/tags", icon: Tag },
  { title: "Members", url: "/members", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from("categories").select("id,name,slug").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
          <img src={atcLogo} alt="ATC Department of ICT logo" className="h-10 w-10 object-contain rounded-md bg-white/95 p-0.5" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sidebar-foreground text-base">ATC Forum</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Arusha Technical College</span>
            </div>
          )}
        </div>

        {user && (
          <div className="px-3 pt-4">
            <NavLink
              to="/ask"
              className="flex items-center gap-2 rounded-md bg-gold px-3 py-2 text-sm font-medium text-gold-foreground shadow-sm transition hover:bg-gold/90"
            >
              <PlusCircle className="h-4 w-4" />
              {!collapsed && <span>Ask Question</span>}
            </NavLink>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton asChild isActive={pathname === `/category/${c.slug}`}>
                    <NavLink to={`/category/${c.slug}`} className="flex items-center gap-2 text-sidebar-foreground/90 hover:bg-sidebar-accent">
                      <BookOpen className="h-4 w-4" />
                      {!collapsed && <span className="truncate">{c.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/profile")}>
                    <NavLink to="/profile" className="flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent">
                      <User className="h-4 w-4" />{!collapsed && <span>Profile</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/notifications")}>
                    <NavLink to="/notifications" className="flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent">
                      <Bell className="h-4 w-4" />{!collapsed && <span>Notifications</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin")}>
                      <NavLink to="/admin" className="flex items-center gap-2 text-gold hover:bg-sidebar-accent">
                        <ShieldCheck className="h-4 w-4" />{!collapsed && <span>Admin</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
