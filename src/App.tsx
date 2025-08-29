import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "@/contexts/ThemeContext";
import AuthProvider from "@/contexts/AuthContext";
import { AuthHandler } from "@/components/auth/AuthHandler";
import { Layout } from "@/components/layout/Layout";
import { Explore } from "@/pages/Explore";
import { Assets } from "@/pages/Assets";
import { Reports } from "@/pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Authentication route */}
              <Route path="/auth" element={<AuthHandler />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/explore" replace />} />
                <Route path="explore" element={<Explore />} />
                <Route path="assets" element={<Assets />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
