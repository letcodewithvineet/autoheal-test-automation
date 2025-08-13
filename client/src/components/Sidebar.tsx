import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { 
    id: 'failures', 
    label: 'Failures', 
    icon: 'fas fa-exclamation-triangle',
    badge: '12',
    badgeVariant: 'default' as const,
    active: true
  },
  { 
    id: 'suggestions', 
    label: 'Suggestions', 
    icon: 'fas fa-lightbulb',
    badge: '5',
    badgeVariant: 'secondary' as const
  },
  { 
    id: 'approvals', 
    label: 'Approvals', 
    icon: 'fas fa-check-circle'
  },
  { 
    id: 'pull-requests', 
    label: 'Pull Requests', 
    icon: 'fas fa-code-branch'
  },
  { 
    id: 'selectors', 
    label: 'Selectors', 
    icon: 'fas fa-crosshairs'
  },
];

const settingsItems = [
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: 'fas fa-cog'
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: 'fas fa-chart-bar'
  },
];

export default function Sidebar() {
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
          {navigationItems.map((item) => (
            <li key={item.id}>
              <a
                href="#"
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <i className={`${item.icon} w-4 h-4`}></i>
                <span className={item.active ? 'font-medium' : ''}>{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant}
                    className={`ml-auto text-xs px-2 py-1 ${
                      item.active ? 'bg-blue-600 text-white' : ''
                    }`}
                    data-testid={`badge-${item.id}`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-4 border-t border-slate-200">
          <ul className="space-y-2">
            {settingsItems.map((item) => (
              <li key={item.id}>
                <a
                  href="#"
                  className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  data-testid={`nav-${item.id}`}
                >
                  <i className={`${item.icon} w-4 h-4`}></i>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
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
