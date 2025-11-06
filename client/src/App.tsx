import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import LoginPage from "@/pages/LoginPage";
import InstitutionDashboard from "@/pages/InstitutionDashboard";
import EvaluatorDashboard from "@/pages/EvaluatorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsersPage from "@/pages/AdminUsersPage";
import ApplicationDetailPage from "@/pages/ApplicationDetailPage";
import MessagesPage from "@/pages/MessagesPage";
import SettingsPage from "@/pages/SettingsPage";
import EvaluationTrackerPage from "@/pages/EvaluationTrackerPage";
import NotFound from "@/pages/not-found";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

function Router() {
  const [location, setLocation] = useLocation();
  const [userRole, setUserRole] = useState<"institution" | "evaluator" | "admin" | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const isLoginPage = location === "/" || location === "/login";

  useEffect(() => {
    const checkSession = async () => {
      if (isLoginPage) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const storedRole = localStorage.getItem("userRole");
        if (storedRole) {
          setUserRole(storedRole as "institution" | "evaluator" | "admin");
        }

        const session = await api.getSession();
        if (session.user && session.user.role) {
          const actualRole = session.user.role as "institution" | "evaluator" | "admin";
          setUserRole(actualRole);
          localStorage.setItem("userRole", actualRole);
        } else {
          localStorage.removeItem("userRole");
          setLocation("/login");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        localStorage.removeItem("userRole");
        setLocation("/login");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [isLoginPage, setLocation]);

  const handleLogin = (role: string) => {
    const validRole = role as "institution" | "evaluator" | "admin";
    setUserRole(validRole);
    localStorage.setItem("userRole", validRole);
  };

  if (isLoginPage) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (isCheckingSession || !userRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole={userRole} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h2 className="text-lg font-medium">AICTE Setu</h2>
                <p className="text-xs text-muted-foreground">Digital Approval Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/dashboard" component={InstitutionDashboard} />
              <Route path="/applications" component={InstitutionDashboard} />
              <Route path="/evaluation-tracker" component={EvaluationTrackerPage} />
              <Route path="/application/:id" component={ApplicationDetailPage} />
              <Route path="/messages" component={MessagesPage} />
              <Route path="/settings" component={SettingsPage} />
              
              <Route path="/evaluator/dashboard" component={EvaluatorDashboard} />
              <Route path="/evaluator/applications" component={EvaluatorDashboard} />
              <Route path="/evaluator/tracker" component={EvaluationTrackerPage} />
              <Route path="/evaluator/messages" component={MessagesPage} />
              
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/users" component={AdminUsersPage} />
              <Route path="/admin/applications" component={InstitutionDashboard} />
              <Route path="/admin/tracker" component={EvaluationTrackerPage} />
              <Route path="/admin/messages" component={MessagesPage} />
              
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
