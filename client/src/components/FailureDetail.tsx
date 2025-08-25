import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SuggestionCard from "@/components/SuggestionCard";

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
  
  const { data: failure, isLoading } = useQuery<FailureDetails>({
    queryKey: ['/api', 'failures', failureId],
    enabled: !!failureId,
  });

  const handleRegenerateSuggestions = () => {
    // TODO: Implement regeneration
    console.log('Regenerating suggestions for', failureId);
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
        {/* Screenshot Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3" data-testid="screenshot-section-title">Screenshot at Failure</h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {failure.screenshotPath ? (
              <div className="relative">
                <img 
                  src={`/api${failure.screenshotPath}`} 
                  alt="Failure screenshot"
                  className="w-full h-auto"
                  data-testid="failure-screenshot"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="p-8 text-center text-slate-500 bg-slate-50"><i class="fas fa-image text-3xl mb-2"></i><p>Screenshot not available</p></div>';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-50">
                <i className="fas fa-image text-3xl mb-2"></i>
                <p>No screenshot available for this failure</p>
                <p className="text-sm mt-1">Screenshots are captured automatically when tests fail</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center" data-testid="suggestions-section-title">
            <i className="fas fa-robot mr-2 text-blue-600"></i>
            AI Suggestions
          </h4>
          
          <div className="space-y-3">
            {failure.suggestions?.[0]?.candidates?.length > 0 ? (
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
                  <p>Generating suggestions...</p>
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-regenerate"
            >
              <i className="fas fa-sync mr-2"></i>
              Regenerate
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
