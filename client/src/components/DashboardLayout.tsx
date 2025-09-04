import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

// Floating particles component for dashboard
const DashboardParticles = () => {
  const [particles, setParticles] = useState<Array<{id: number, left: number, delay: number}>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="floating-particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '12s'
          }}
        />
      ))}
    </div>
  );
};

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
    <div className="min-h-screen ai-login-background flex relative">
      <DashboardParticles />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <TopBar filters={filters} onFiltersChange={handleFiltersChange} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}