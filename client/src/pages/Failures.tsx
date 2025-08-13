import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Failure {
  id: string;
  test: string;
  repo: string;
  specPath: string;
  browser: string;
  timestamp: string;
  currentSelector: string;
  status: string;
  errorMessage?: string;
  suggestionCount?: number;
  prNumber?: number;
}

export default function Failures() {
  const [filters, setFilters] = useState({
    repo: '',
    timeframe: 'week'
  });

  const { data: failures, isLoading, error } = useQuery<Failure[]>({
    queryKey: ['/api/failures', filters],
    enabled: true,
  });

  const getStatusBadge = (status: string, suggestionCount = 0, prNumber?: number) => {
    if (prNumber) {
      return <Badge variant="default" className="bg-green-100 text-green-800">1 Approved</Badge>;
    }
    if (suggestionCount > 0) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">{suggestionCount} Suggestions</Badge>;
    }
    if (status === 'analyzing') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Analyzing</Badge>;
    }
    return <Badge variant="destructive" className="bg-red-100 text-red-800">Failed</Badge>;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 p-6">
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-slate-50 p-6">
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
              <p>Failed to load failures</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50" data-testid="failures-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800" data-testid="page-title">All Test Failures</h1>
            <p className="text-slate-600 mt-1">Complete list of test failures across all repositories</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Filter Controls */}
            <div className="flex items-center space-x-2">
              <Select value={filters.repo} onValueChange={(value) => setFilters({...filters, repo: value})}>
                <SelectTrigger className="w-[160px]" data-testid="select-repo">
                  <SelectValue placeholder="All Repos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Repos</SelectItem>
                  <SelectItem value="frontend-app">frontend-app</SelectItem>
                  <SelectItem value="api-service">api-service</SelectItem>
                  <SelectItem value="e-commerce-app">e-commerce-app</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.timeframe} onValueChange={(value) => setFilters({...filters, timeframe: value})}>
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
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-refresh"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200" data-testid="failures-card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800" data-testid="card-title">All Failures</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span data-testid="total-failures">{failures?.length || 0} total failures</span>
                <span className="text-slate-400">•</span>
                <span data-testid="pending-suggestions">
                  {failures?.filter(f => f.suggestionCount && f.suggestionCount > 0).length || 0} pending suggestions
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {failures?.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <i className="fas fa-check-circle text-4xl mb-4 text-green-500"></i>
                <h3 className="text-lg font-medium mb-2">No failures found</h3>
                <p>All tests are passing! 🎉</p>
              </div>
            ) : (
              failures?.map((failure) => (
                <div
                  key={failure.id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                  data-testid={`failure-row-${failure.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-times text-red-600"></i>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-slate-800" data-testid={`test-name-${failure.id}`}>
                          {failure.test}
                        </h4>
                        {getStatusBadge(failure.status, failure.suggestionCount, failure.prNumber)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                        <span data-testid={`repo-${failure.id}`}>
                          <i className="fas fa-code-branch mr-1"></i>
                          {failure.repo}
                        </span>
                        <span data-testid={`spec-path-${failure.id}`}>
                          <i className="fas fa-file-code mr-1"></i>
                          {failure.specPath}
                        </span>
                        <span data-testid={`browser-${failure.id}`}>
                          <i className="fas fa-globe mr-1"></i>
                          {failure.browser}
                        </span>
                        <span data-testid={`timestamp-${failure.id}`}>
                          <i className="fas fa-clock mr-1"></i>
                          {formatTimeAgo(failure.timestamp)}
                        </span>
                      </div>
                      <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm">
                        <div className="text-slate-600 mb-1">Failed selector:</div>
                        <div className="text-red-600" data-testid={`failed-selector-${failure.id}`}>
                          {failure.currentSelector}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {failure.prNumber && (
                        <span className="text-green-600 text-sm font-medium" data-testid={`pr-number-${failure.id}`}>
                          PR #{failure.prNumber}
                        </span>
                      )}
                      {failure.status === 'analyzing' ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-slate-600">Processing</span>
                        </div>
                      ) : (
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid={`button-view-details-${failure.id}`}
                          onClick={() => {
                            // Navigate to failure detail or open modal
                            console.log('View details for failure:', failure.id);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
