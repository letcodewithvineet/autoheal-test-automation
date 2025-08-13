import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopBarProps {
  filters: {
    repo: string;
    timeframe: string;
  };
  onFiltersChange: (filters: { repo: string; timeframe: string }) => void;
}

export default function TopBar({ filters, onFiltersChange }: TopBarProps) {
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

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4" data-testid="topbar">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800" data-testid="page-title">Test Failures</h2>
          <p className="text-slate-600 mt-1">Monitor and resolve failing test cases</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <Select value={filters.repo} onValueChange={handleRepoChange}>
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
            
            <Select value={filters.timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[140px]" data-testid="select-timeframe">
                <SelectValue placeholder="Last 7 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24 hours</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Refresh Button */}
          <Button 
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-refresh"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
}
