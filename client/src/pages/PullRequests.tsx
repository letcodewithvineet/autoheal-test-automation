import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";

interface PullRequest {
  id: string;
  failureId: string;
  suggestionId: string;
  approvalId: string;
  title: string;
  repo: string;
  branch: string;
  prNumber?: number;
  prUrl?: string;
  status: 'open' | 'merged' | 'closed';
  description: string;
  filesChanged?: string[];
  createdAt: string;
  mergedAt?: string;
}

export default function PullRequests() {
  const { data: pullRequests = [], isLoading } = useQuery<PullRequest[]>({
    queryKey: ['/api/pull-requests'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'merged': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return 'fa-code-branch';
      case 'merged': return 'fa-check-circle';
      case 'closed': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Pull Requests</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-slate-200 rounded-t-lg"></CardHeader>
              <CardContent className="h-32 bg-slate-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6" data-testid="pull-requests-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-slate-800">Active Pull Requests</h2>
          <i className="fas fa-sync text-slate-400 text-sm" title="Real-time GitHub PRs"></i>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" data-testid="pr-count">
            <i className="fas fa-code-branch mr-1"></i>
            {pullRequests.length} Active PRs
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {pullRequests.map((pr) => (
          <Card key={pr.id} className="border border-slate-200" data-testid={`pr-${pr.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-slate-800">{pr.title}</h3>
                  {pr.prNumber && (
                    <Badge variant="outline" className="text-xs">
                      #{pr.prNumber}
                    </Badge>
                  )}
                </div>
                <Badge className={`${getStatusColor(pr.status)} border`} data-testid={`pr-status-${pr.status}`}>
                  <i className={`fas ${getStatusIcon(pr.status)} mr-1`}></i>
                  {pr.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span><i className="fas fa-code-branch mr-1"></i>{pr.repo}</span>
                <span><i className="fas fa-git-alt mr-1"></i>{pr.branch}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Files Changed</h4>
                  <div className="space-y-1">
                    {(pr.filesChanged || []).map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <i className="fas fa-file-code text-blue-500"></i>
                        <code className="text-blue-600">{file}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    Created {new Date(pr.createdAt).toLocaleDateString()}
                    {pr.mergedAt && (
                      <span> • Merged {new Date(pr.mergedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {pr.prUrl && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        data-testid={`view-pr-${pr.id}`}
                        onClick={() => window.open(pr.prUrl, '_blank')}
                        className="hover:bg-blue-50 border-blue-200 text-blue-700"
                      >
                        <i className="fab fa-github mr-2"></i>
                        View on GitHub
                      </Button>
                    )}
                    {pr.prNumber && (
                      <Badge variant="outline" className="text-slate-600">
                        PR #{pr.prNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {pullRequests.length === 0 && (
          <Card className="text-center py-12 border-dashed border-2 border-slate-200">
            <CardContent>
              <i className="fab fa-github text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No active pull requests</h3>
              <p className="text-slate-500 mb-4">Pull requests will appear here when you approve AI suggestions</p>
              <div className="text-sm text-slate-400">
                <i className="fas fa-lightbulb mr-1"></i>
                Tip: Go to Failures → View Details → Approve suggestion to create a PR
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}