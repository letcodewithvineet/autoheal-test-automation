import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Brain, AlertTriangle, Lightbulb, CheckCircle, GitBranch, Target, Settings, BarChart3 } from "lucide-react";

// Base navigation items without badge data
const baseNavigationItems = [
  { 
    id: 'failures', 
    label: 'Test Failures', 
    icon: AlertTriangle,
    badgeVariant: 'default' as const,
    path: '/failures'
  },
  { 
    id: 'suggestions', 
    label: 'AI Suggestions', 
    icon: Lightbulb,
    badgeVariant: 'secondary' as const,
    path: '/suggestions'
  },
  { 
    id: 'approvals', 
    label: 'Approvals', 
    icon: CheckCircle,
    path: '/approvals'
  },
  { 
    id: 'pull-requests', 
    label: 'Auto PRs', 
    icon: GitBranch,
    path: '/pull-requests'
  },
  { 
    id: 'selectors', 
    label: 'Selectors', 
    icon: Target,
    path: '/selectors'
  },
];

const settingsItems = [
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings,
    path: '/settings'
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart3,
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
    <div className="w-64 glass-card border-r-0 rounded-r-none rounded-l-none flex flex-col relative z-20" data-testid="sidebar" style={{ borderRadius: '0 20px 20px 0' }}>
      {/* Logo & Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center ai-icon">
            <Brain className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-title" data-testid="app-title">AI AutoHeal</h1>
            <p className="text-xs text-white/60">Self-Healing Tests</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.path || (location === '/' && item.id === 'failures');
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <IconComponent className={`w-5 h-5 ${
                    isActive ? 'text-cyan-400' : 'text-white/70 group-hover:text-white'
                  }`} />
                  <span className={`${isActive ? 'font-semibold' : 'font-medium'} text-sm`}>{item.label}</span>
                  {item.badge && (
                    <Badge 
                      className={`ml-auto text-xs px-2 py-1 border-0 ${
                        isActive 
                          ? 'bg-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/20' 
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
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

        <div className="mt-8 pt-4 border-t border-white/10">
          <ul className="space-y-1">
            {settingsItems.map((item) => {
              const isActive = location === item.path;
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                    data-testid={`nav-${item.id}`}
                  >
                    <IconComponent className={`w-5 h-5 ${
                      isActive ? 'text-cyan-400' : 'text-white/70 group-hover:text-white'
                    }`} />
                    <span className={`${isActive ? 'font-semibold' : 'font-medium'} text-sm`}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Status Indicator */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3 text-sm">
          <div className="relative">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" data-testid="status-indicator"></div>
            <div className="absolute inset-0 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-cyan-300 font-medium" data-testid="system-status">AI System Online</span>
        </div>
        <div className="text-xs text-white/50 mt-1" data-testid="last-update">Neural network active • 2 min ago</div>
      </div>
    </div>
  );
}
