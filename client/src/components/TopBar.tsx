import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TopBarProps {
  filters: {
    repo: string;
    timeframe: string;
  };
  onFiltersChange: (filters: { repo: string; timeframe: string }) => void;
}

export default function TopBar({ filters, onFiltersChange }: TopBarProps) {
  const { user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for creating legacytouch.com failure scenario
  const createLegacytouchFailure = useMutation({
    mutationFn: () => apiRequest('/api/create-legacytouch-failure', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/failures'] });
      toast({
        title: "Success",
        description: "LegacyTouch.com failure scenario created successfully! Check the failures list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create legacytouch.com failure scenario",
        variant: "destructive",
      });
    }
  });

  const handleRepoChange = (value: string) => {
    onFiltersChange({ ...filters, repo: value });
  };

  const handleTimeframeChange = (value: string) => {
    onFiltersChange({ ...filters, timeframe: value });
  };

  const handleRefresh = () => {
    // TODO: Implement refresh functionality
    console.log('Refreshing data...');
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Logout failed",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4" data-testid="topbar">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800" data-testid="page-title">AutoHeal Dashboard</h2>
          <p className="text-slate-600 mt-1">Monitor and resolve failing test cases</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <Select value={filters.repo || "all"} onValueChange={handleRepoChange}>
              <SelectTrigger className="w-[160px]" data-testid="select-repo">
                <SelectValue placeholder="All Repos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Repos</SelectItem>
                <SelectItem value="frontend-app">frontend-app</SelectItem>
                <SelectItem value="api-service">api-service</SelectItem>
                <SelectItem value="e-commerce-app">e-commerce-app</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.timeframe || "week"} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[140px]" data-testid="select-timeframe">
                <SelectValue placeholder="Last 7 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="day">Last 24 hours</SelectItem>
                <SelectItem value="month">Last month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Create LegacyTouch Scenario Button */}
          <Button 
            onClick={() => createLegacytouchFailure.mutate()}
            disabled={createLegacytouchFailure.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-create-legacytouch"
          >
            <Plus className="h-4 w-4 mr-2" />
            {createLegacytouchFailure.isPending ? 'Creating...' : 'Add LegacyTouch Login'}
          </Button>

          {/* Refresh Button */}
          <Button 
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-refresh"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </Button>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <User className="h-4 w-4" />
              <span data-testid="text-username">{user?.username}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
              data-testid="button-logout"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
