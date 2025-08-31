import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Base navigation items without badge data
const baseNavigationItems = [
  { 
    id: 'failures', 
    label: 'Failures', 
    icon: 'fas fa-exclamation-triangle',
    badgeVariant: 'default' as const,
    path: '/failures'
  },
  { 
    id: 'suggestions', 
    label: 'Suggestions', 
    icon: 'fas fa-lightbulb',
    badgeVariant: 'secondary' as const,
    path: '/suggestions'
  },
  { 
    id: 'approvals', 
    label: 'Approvals', 
    icon: 'fas fa-check-circle',
    path: '/approvals'
  },
  { 
    id: 'pull-requests', 
    label: 'Pull Requests', 
    icon: 'fas fa-code-branch',
    path: '/pull-requests'
  },
  { 
    id: 'selectors', 
    label: 'Selectors', 
    icon: 'fas fa-crosshairs',
    path: '/selectors'
  },
];

const settingsItems = [
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: 'fas fa-cog',
    path: '/settings'
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: 'fas fa-chart-bar',
    path: '/analytics'
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  
  // Fetch counts for badges
  const { data: failuresData = [] } = useQuery<any[]>({ 
    queryKey: ['/api/failures'], 
    staleTime: 30000 // Cache for 30 seconds
  });
  const { data: suggestionsData = [] } = useQuery<any[]>({ 
    queryKey: ['/api/suggestions'], 
    staleTime: 30000
  });
  const { data: approvalsData = [] } = useQuery<any[]>({ 
    queryKey: ['/api/approvals'], 
    staleTime: 30000
  });
  const { data: pullRequestsData = [] } = useQuery<any[]>({ 
    queryKey: ['/api/pull-requests'], 
    staleTime: 30000
  });
  
  // Create navigation items with real badge counts
  const navigationItems = baseNavigationItems.map(item => {
    let badge = '';
    
    switch (item.id) {
      case 'failures':
        badge = failuresData.length > 0 ? failuresData.length.toString() : '';
        break;
      case 'suggestions':
        badge = suggestionsData.length > 0 ? suggestionsData.length.toString() : '';
        break;
      case 'approvals':
        badge = approvalsData.length > 0 ? approvalsData.length.toString() : '';
        break;
      case 'pull-requests':
        badge = pullRequestsData.length > 0 ? pullRequestsData.length.toString() : '';
        break;
    }
    
    return {
      ...item,
      badge: badge || undefined
    };
  });
  
  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
      {/* Logo & Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-800" data-testid="app-title">AutoHeal</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Self-Healing Tests</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path || (location === '/' && item.id === 'failures');
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <i className={`${item.icon} w-4 h-4`}></i>
                  <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant={item.badgeVariant}
                      className={`ml-auto text-xs px-2 py-1 ${
                        isActive ? 'bg-blue-600 text-white' : ''
                      }`}
                      data-testid={`badge-${item.id}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 pt-4 border-t border-slate-200">
          <ul className="space-y-2">
            {settingsItems.map((item) => {
              const isActive = location === item.path;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    data-testid={`nav-${item.id}`}
                  >
                    <i className={`${item.icon} w-4 h-4`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Status Indicator */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-testid="status-indicator"></div>
          <span className="text-slate-600" data-testid="system-status">System Active</span>
        </div>
        <div className="text-xs text-slate-500 mt-1" data-testid="last-update">Last update: 2 min ago</div>
      </div>
    </div>
  );
}
