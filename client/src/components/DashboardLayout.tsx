import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [filters, setFilters] = useState({
    repo: 'api-service',
    timeframe: 'week'
  });

  const handleFiltersChange = (newFilters: { repo: string; timeframe: string }) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar filters={filters} onFiltersChange={handleFiltersChange} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}