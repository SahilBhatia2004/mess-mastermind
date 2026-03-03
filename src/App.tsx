import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppSidebar from "./components/AppSidebar";
import AppHeader from "./components/AppHeader";
import Dashboard from "./pages/Dashboard";
import UploadData from "./pages/UploadData";
import Soldiers from "./pages/Soldiers";
import DailyEntry from "./pages/DailyEntry";
import Bills from "./pages/Bills";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto scrollbar-thin">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<UploadData />} />
                <Route path="/soldiers" element={<Soldiers />} />
                <Route path="/daily-entry" element={<DailyEntry />} />
                <Route path="/bills" element={<Bills />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
