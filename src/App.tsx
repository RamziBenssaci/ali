import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ReportsList from "./pages/reports/ReportsList";
import NewReport from "./pages/reports/NewReport";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import ReportView from "./pages/reports/ReportView";
import Warehouse from "./pages/supply/Warehouse";
import DirectPurchase from "./pages/supply/DirectPurchase";
import DentalContracts from "./pages/dental/Contracts";
import DentalReports from "./pages/dental/Reports";
import DentalDashboard from "./pages/dental/Dashboard";
import Assets from "./pages/dental/Assets";
import WarehouseDashboard from "./pages/supply/WarehouseDashboard";
import DispensingReports from "./pages/supply/DispensingReports";
import NewPurchase from "./pages/direct-purchase/NewPurchase";
import TrackOrders from "./pages/direct-purchase/TrackOrders";
import DirectPurchaseReports from "./pages/direct-purchase/Reports";
import DirectPurchaseDashboard from "./pages/direct-purchase/Dashboard";
import AssetsDashboard from "./pages/dental/AssetsDashboard";
import NewTransaction from "./pages/transactions/NewTransaction";
import TransactionsList from "./pages/transactions/TransactionsList";
import TransactionsDashboard from "./pages/transactions/TransactionsDashboard";
import FacilityManagement from "./pages/settings/FacilityManagement";
import AdminCredentials from "./pages/settings/AdminCredentials";
import StaffManagement from "./pages/settings/StaffManagement";
import AdminLogin from "./pages/auth/AdminLogin";
import StaffLogin from "./pages/auth/StaffLogin";
import RouteProtection from "./components/RouteProtection";
import PermissionDenied from "./pages/PermissionDenied";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Routes>
            {/* Auth Routes (No Layout) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/login" element={<StaffLogin />} />
            <Route path="/permission-denied" element={<PermissionDenied />} />
            
            {/* Main App Routes (With Layout) */}
            <Route path="/*" element={
              <RouteProtection>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reports/list" element={<ReportsList />} />
                    <Route path="/reports/new" element={<NewReport />} />
                    <Route path="/reports/dashboard" element={<ReportsDashboard />} />
                    <Route path="/reports/view/:id" element={<ReportView />} />
                    <Route path="/supply/warehouse" element={<Warehouse />} />
                    <Route path="/supply/warehouse-dashboard" element={<WarehouseDashboard />} />
                    <Route path="/supply/dispensing-reports" element={<DispensingReports />} />
                    <Route path="/supply/direct-purchase" element={<DirectPurchase />} />
                    <Route path="/direct-purchase/new" element={<NewPurchase />} />
                    <Route path="/direct-purchase/track" element={<TrackOrders />} />
                    <Route path="/direct-purchase/reports" element={<DirectPurchaseReports />} />
                    <Route path="/direct-purchase/dashboard" element={<DirectPurchaseDashboard />} />
                    <Route path="/dental/contracts" element={<DentalContracts />} />
                    <Route path="/dental/reports" element={<DentalReports />} />
                    <Route path="/dental/dashboard" element={<DentalDashboard />} />
                    <Route path="/dental/assets" element={<Assets />} />
                    <Route path="/dental/assets-dashboard" element={<AssetsDashboard />} />
                    <Route path="/transactions/new" element={<NewTransaction />} />
                    <Route path="/transactions/list" element={<TransactionsList />} />
                    <Route path="/transactions/dashboard" element={<TransactionsDashboard />} />
                    <Route path="/settings/facilities" element={<FacilityManagement />} />
                    <Route path="/settings/admin" element={<AdminCredentials />} />
                    <Route path="/settings/staff" element={<StaffManagement />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </RouteProtection>
            } />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
