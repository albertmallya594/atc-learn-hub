import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 animate-fade-in-slow">
            <Outlet />
          </main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} ATC Q&A Forum · Arusha Technical College
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
