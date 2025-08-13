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
    window.location.reload();
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
            <select 
              value={filters.repo} 
              onChange={(e) => handleRepoChange(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="select-repo"
            >
              <option value="">All Repos</option>
              <option value="frontend-app">frontend-app</option>
              <option value="api-service">api-service</option>
              <option value="e-commerce-app">e-commerce-app</option>
            </select>
            
            <select 
              value={filters.timeframe} 
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="select-timeframe"
            >
              <option value="day">Last 24 hours</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last month</option>
            </select>
          </div>
          
          {/* Refresh Button */}
          <button 
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
            data-testid="button-refresh"
          >
            <i className="fas fa-sync-alt"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
