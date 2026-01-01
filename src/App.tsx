import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import NotificationProvider from "@/components/NotificationProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
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
import PropertyDetails from "./pages/PropertyDetails";
import ExploreProperties from "./pages/ExploreProperties";
import MyFavorites from "./pages/MyFavorites";
import PriceAlerts from "./pages/PriceAlerts";
import Messages from "./pages/Messages";
import Contracts from "./pages/Contracts";
import RentGuarantee from "./pages/RentGuarantee";
import ServicesMarketplace from "./pages/ServicesMarketplace";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <OfflineIndicator />
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
              <Route path="/my-properties" element={<MyProperties />} />
              <Route path="/my-requests" element={<MyRequests />} />
              <Route path="/browse-tenants" element={<BrowseTenants />} />
              <Route path="/my-offers" element={<MyOffers />} />
              <Route path="/explore-properties" element={<ExploreProperties />} />
              <Route path="/my-favorites" element={<MyFavorites />} />
              <Route path="/price-alerts" element={<PriceAlerts />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/rent-guarantee" element={<RentGuarantee />} />
              <Route path="/services" element={<ServicesMarketplace />} />
              <Route path="/install" element={<Install />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PWAInstallPrompt variant="banner" />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
