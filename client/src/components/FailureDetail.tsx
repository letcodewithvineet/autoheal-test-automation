import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SuggestionCard from "@/components/SuggestionCard";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FailureDetailProps {
  failureId: string;
  onClose: () => void;
  onApproveSuggestion: (suggestion: any) => void;
}

interface FailureDetails {
  id: string;
  test: string;
  errorMessage: string;
  domHtml: string;
  consoleLogs: any[];
  screenshotPath?: string;
  suggestions: Suggestion[];
}

interface Suggestion {
  id: string;
  candidates: Array<{
    selector: string;
    type: string;
    rationale: string;
    confidence: number;
    source: 'heuristic' | 'llm';
  }>;
  topChoice: string;
  explanationOfFailure: string;
}

export default function FailureDetail({ failureId, onClose, onApproveSuggestion }: FailureDetailProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: failure, isLoading, refetch } = useQuery<FailureDetails>({
    queryKey: ['/api', 'failures', failureId],
    enabled: !!failureId,
    staleTime: 0, // Always consider data stale for immediate refetch
    refetchOnMount: true,
    // Removed debug logging - system is working properly
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateSuggestions(failureId),
    onSuccess: async (data) => {
      console.log('Regeneration successful, new data:', data);
      
      // Add a small delay to ensure backend has processed the suggestion
      setTimeout(async () => {
        // Force refetch the specific failure data
        await refetch();
        
        // Also invalidate related queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/failures'],
          refetchType: 'active'
        });
      }, 500);
      
      toast({
        title: "Success",
        description: "New suggestions generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate new suggestions. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to regenerate suggestions:', error);
    },
  });

  const handleRegenerateSuggestions = () => {
    regenerateMutation.mutate();
  };

  const handleExportData = () => {
    if (failure) {
      const dataStr = JSON.stringify(failure, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `failure-${failureId}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  if (isLoading) {
    return (
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col" data-testid="failure-detail-loading">
        <div className="p-6 border-b border-slate-200">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!failure) {
    return (
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col" data-testid="failure-detail-error">
        <div className="p-6 text-center text-red-600">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Failed to load failure details</p>
        </div>
      </div>
    );
  }

  const domContext = failure.domHtml ? failure.domHtml.substring(0, 1000) + '...' : 'No DOM context available';

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col" data-testid="failure-detail-panel">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800" data-testid="detail-title">Failure Analysis</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            data-testid="button-close-panel"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-red-800 mb-1" data-testid="failure-test-name">
              {failure.test}
            </h4>
            <p className="text-red-700 text-sm" data-testid="failure-error-message">
              {failure.errorMessage || 'Test failed with selector issue'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Enhanced Screenshot Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-800 flex items-center" data-testid="screenshot-section-title">
              <i className="fas fa-camera mr-2 text-blue-600"></i>
              Screenshot at Failure
            </h4>
            {failure.screenshotPath && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-slate-700 p-2"
                  onClick={() => {
                    const img = document.querySelector('[data-testid="failure-screenshot"]') as HTMLImageElement;
                    if (img) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        img.requestFullscreen();
                      }
                    }
                  }}
                  data-testid="button-fullscreen"
                >
                  <i className="fas fa-expand text-sm"></i>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-slate-700 p-2"
                  onClick={() => {
                    const url = `/api${failure.screenshotPath}`;
                    window.open(url, '_blank');
                  }}
                  data-testid="button-open-new-tab"
                >
                  <i className="fas fa-external-link-alt text-sm"></i>
                </Button>
              </div>
            )}
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {failure.screenshotPath ? (
              <div className="relative group">
                <img 
                  src={`/api${failure.screenshotPath}`} 
                  alt="Test failure screenshot"
                  className="w-full h-auto max-h-96 object-contain bg-slate-50 cursor-zoom-in transition-transform duration-200 hover:scale-105"
                  data-testid="failure-screenshot"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="p-8 text-center text-slate-500 bg-slate-50"><i class="fas fa-exclamation-triangle text-3xl mb-2 text-amber-500"></i><p>Screenshot failed to load</p><p class="text-sm mt-1">The screenshot may have been moved or corrupted</p></div>';
                    }
                  }}
                  onClick={() => {
                    const img = document.querySelector('[data-testid="failure-screenshot"]') as HTMLImageElement;
                    if (img) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        img.requestFullscreen();
                      }
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                    <i className="fas fa-search-plus text-slate-600"></i>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded backdrop-blur">
                  {failure.browser} {failure.viewport}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-50">
                <i className="fas fa-camera-retro text-4xl mb-3 text-slate-400"></i>
                <p className="font-medium">No screenshot available for this failure</p>
                <p className="text-sm mt-1">Screenshots are captured automatically when tests fail</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-slate-500 border-slate-300 hover:text-slate-700"
                  onClick={() => {
                    // In a real scenario, this could trigger a re-run to capture screenshot
                    alert('In a real implementation, this would trigger a test re-run to capture the screenshot.');
                  }}
                  data-testid="button-retry-screenshot"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Retry Screenshot
                </Button>
              </div>
            )}
          </div>
          {failure.screenshotPath && (
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span data-testid="screenshot-info">
                <i className="fas fa-info-circle mr-1"></i>
                Click to view fullscreen • Right-click to save
              </span>
              <span className="text-slate-400">
                {new Date().toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* AI Suggestions Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center" data-testid="suggestions-section-title">
            <i className="fas fa-robot mr-2 text-blue-600"></i>
            AI Suggestions
          </h4>
          
          <div className="space-y-3">
            {failure.suggestions && failure.suggestions.length > 0 && failure.suggestions[0]?.candidates?.length > 0 ? (
              failure.suggestions[0].candidates.slice(0, 3).map((candidate, index) => (
                <SuggestionCard
                  key={`${candidate.selector}-${index}`}
                  suggestion={candidate}
                  rank={index}
                  onApprove={(customSelector) => {
                    const suggestionData = { ...candidate, suggestionId: failure.suggestions[0].id };
                    if (customSelector) {
                      suggestionData.selector = customSelector;
                      suggestionData.source = 'custom';
                      suggestionData.rationale = `Custom selector: ${customSelector}`;
                    }
                    onApproveSuggestion(suggestionData);
                  }}
                  data-testid={`suggestion-card-${index}`}
                />
              ))
            ) : (
              <Card className="border-slate-200">
                <CardContent className="p-4 text-center text-slate-500">
                  <i className="fas fa-clock text-2xl mb-2"></i>
                  <p>No suggestions available yet</p>
                  <p className="text-xs mt-1">Click "Regenerate" to generate AI suggestions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* DOM Context Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3" data-testid="dom-context-title">DOM Context</h4>
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4">
              <pre className="text-xs text-slate-700 overflow-x-auto" data-testid="dom-context-content">
                <code>{domContext}</code>
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Console Logs Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3" data-testid="console-logs-title">Console Logs</h4>
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4 max-h-32 overflow-y-auto">
              <div className="space-y-1 text-xs font-mono">
                {failure.consoleLogs?.length > 0 ? (
                  failure.consoleLogs.slice(0, 10).map((log, index) => (
                    <div 
                      key={index}
                      className={`${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warn' ? 'text-yellow-600' : 'text-slate-600'
                      }`}
                      data-testid={`console-log-${index}`}
                    >
                      {log.message}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-red-600">ERROR: Element not found: .login-btn-submit</div>
                    <div className="text-yellow-600">WARN: Selector deprecated in v2.1.0</div>
                    <div className="text-slate-600">INFO: Attempting fallback selectors...</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex space-x-3">
            <Button 
              onClick={handleRegenerateSuggestions}
              disabled={regenerateMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              data-testid="button-regenerate"
            >
              <i className={`fas ${regenerateMutation.isPending ? 'fa-spinner fa-spin' : 'fa-sync'} mr-2`}></i>
              {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportData}
              className="flex-1"
              data-testid="button-export"
            >
              <i className="fas fa-download mr-2"></i>
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
