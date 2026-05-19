import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import { AppErrorBoundary } from "@/components/shared/ErrorBoundary";

// Pages
import Index from "./pages/Index";
import TeacherDashboard from "./pages/TeacherDashboard";
import QuizPage from "./pages/QuizPage";
import PricingPage from "./pages/PricingPage";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ForTeachers from "./pages/ForTeachers";
import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// ── Guest Gate ────────────────────────────────────────────────────────────────
// Auto-provisions a guest session when accessing /app/* so no login is needed.
const GuestGate = ({ children }: { children: React.ReactNode }) => {
  const { user, manualLogin } = useAuth();

  useEffect(() => {
    if (!user) {
      manualLogin(
        {
          id: "guest-teacher-id",
          name: "System Administrator",
          email: "admin@aicoteacher.com",
          role: "TEACHER",
        },
        "guest-bypass-token"
      );
    }
  }, [user, manualLogin]);

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
          Initializing Platform...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

// ── App Routes ────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* ── Public Routes ── */}
    <Route path="/" element={<Index />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/for-teachers" element={<ForTeachers />} />

    {/* ── Login / Signup → Redirect straight to dashboard (no auth needed) ── */}
    <Route path="/login" element={<Navigate to="/app/dashboard" replace />} />
    <Route path="/signup" element={<Navigate to="/app/dashboard" replace />} />

    {/* ── Protected Routes ── auto-provision guest, no login required ── */}
    <Route
      path="/app"
      element={
        <GuestGate>
          <AppLayout />
        </GuestGate>
      }
    >
      <Route path="dashboard" element={<TeacherDashboard />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Route>

    {/* ── Legacy / Utility ── */}
    <Route path="/quiz/:id" element={<QuizPage />} />
    <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// ── Root ──────────────────────────────────────────────────────────────────────
const App = () => {
  useEffect(() => {
    console.log("✅ Co-Teacher Platform Online");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppErrorBoundary>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
