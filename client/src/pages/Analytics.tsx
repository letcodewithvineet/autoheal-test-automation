import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";

interface AnalyticsData {
  totalFailures: number;
  totalSuggestions: number;
  approvalRate: number;
  fixSuccessRate: number;
  repositoryStats: Array<{
    repo: string;
    failures: number;
    fixes: number;
  }>;
  selectorTypeStats: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    failures: number;
    fixes: number;
  }>;
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 bg-slate-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const mockData: AnalyticsData = {
    totalFailures: 47,
    totalSuggestions: 32,
    approvalRate: 0.85,
    fixSuccessRate: 0.92,
    repositoryStats: [
      { repo: 'e-commerce-app', failures: 18, fixes: 15 },
      { repo: 'frontend-app', failures: 12, fixes: 11 },
      { repo: 'api-service', failures: 17, fixes: 14 }
    ],
    selectorTypeStats: [
      { type: 'data-testid', count: 22, successRate: 0.95 },
      { type: 'class', count: 15, successRate: 0.73 },
      { type: 'aria', count: 8, successRate: 0.88 },
      { type: 'xpath', count: 2, successRate: 0.50 }
    ],
    weeklyTrends: [
      { week: 'Week 1', failures: 8, fixes: 6 },
      { week: 'Week 2', failures: 12, fixes: 10 },
      { week: 'Week 3', failures: 15, fixes: 13 },
      { week: 'Week 4', failures: 12, fixes: 11 }
    ]
  };

  const data = analytics || mockData;

  return (
    <DashboardLayout>
      <div className="p-6" data-testid="analytics-page">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-4">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Failures</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="total-failures">
                  {data.totalFailures}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <i className="fas fa-lightbulb text-blue-600"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">AI Suggestions</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="total-suggestions">
                  {data.totalSuggestions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Approval Rate</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="approval-rate">
                  {Math.round(data.approvalRate * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <i className="fas fa-code-branch text-purple-600"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Fix Success Rate</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="fix-success-rate">
                  {Math.round(data.fixSuccessRate * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repository Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">Repository Breakdown</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.repositoryStats.map((repo, index) => (
                <div key={index} className="flex items-center justify-between" data-testid={`repo-stat-${repo.repo}`}>
                  <div>
                    <p className="font-medium text-slate-700">{repo.repo}</p>
                    <p className="text-sm text-slate-500">{repo.failures} failures • {repo.fixes} fixes</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {Math.round((repo.fixes / repo.failures) * 100)}% fixed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selector Type Performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">Selector Performance</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.selectorTypeStats.map((selector, index) => (
                <div key={index} className="flex items-center justify-between" data-testid={`selector-stat-${selector.type}`}>
                  <div>
                    <p className="font-medium text-slate-700">{selector.type}</p>
                    <p className="text-sm text-slate-500">{selector.count} used</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selector.successRate * 100}%` }}
                      ></div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selector.successRate >= 0.9 ? 'text-green-700 border-green-300' :
                        selector.successRate >= 0.7 ? 'text-yellow-700 border-yellow-300' :
                        'text-red-700 border-red-300'
                      }`}
                    >
                      {Math.round(selector.successRate * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">Weekly Trends</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.weeklyTrends.map((week, index) => (
                <div key={index} className="flex items-center space-x-4" data-testid={`week-${index + 1}`}>
                  <div className="w-16 text-sm text-slate-600">{week.week}</div>
                  <div className="flex-1 flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">{week.failures} failures</span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{week.fixes} fixes</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    {Math.round((week.fixes / week.failures) * 100)}% resolved
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
}