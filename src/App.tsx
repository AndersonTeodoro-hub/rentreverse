import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import TenantOnboarding from "./pages/TenantOnboarding";
import LandlordOnboarding from "./pages/LandlordOnboarding";
import Dashboard from "./pages/Dashboard";
import Verifications from "./pages/Verifications";
import MyProperties from "./pages/MyProperties";
import MyRequests from "./pages/MyRequests";
import BrowseTenants from "./pages/BrowseTenants";
import MyOffers from "./pages/MyOffers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/tenant/onboarding" element={<TenantOnboarding />} />
            <Route path="/landlord/onboarding" element={<LandlordOnboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verifications" element={<Verifications />} />
            <Route path="/properties" element={<MyProperties />} />
            <Route path="/requests" element={<MyRequests />} />
            <Route path="/browse-tenants" element={<BrowseTenants />} />
            <Route path="/offers" element={<MyOffers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
