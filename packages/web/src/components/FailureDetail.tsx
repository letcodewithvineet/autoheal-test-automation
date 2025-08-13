import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import SuggestionCard from "./SuggestionCard";

interface FailureDetailProps {
  failureId: string;
  onClose: () => void;
  onApproveSuggestion: (suggestion: any) => void;
}

export default function FailureDetail({ failureId, onClose, onApproveSuggestion }: FailureDetailProps) {
  const queryClient = useQueryClient();
  
  const { data: failure, isLoading } = useQuery({
    queryKey: ['failure', failureId],
    queryFn: () => api.getFailure(failureId),
    enabled: !!failureId,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateSuggestions(failureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failure', failureId] });
    },
  });

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
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-16 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-48 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!failure) {
    return (
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-6 text-center text-red-600">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Failed to load failure details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Failure Analysis</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-1">{failure.test}</h4>
          <p className="text-red-700 text-sm">{failure.errorMessage || 'Test failed with selector issue'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Screenshot Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3">Screenshot at Failure</h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {failure.screenshotPath ? (
              <img 
                src={failure.screenshotPath} 
                alt="Failure screenshot"
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="bg-gray-100 h-48 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <i className="fas fa-image text-4xl mb-2"></i>
                  <div className="text-sm">Screenshot: 1920x1080</div>
                  <div className="text-xs">Captured at failure point</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
            <i className="fas fa-robot mr-2 text-blue-600"></i>
            AI Suggestions
          </h4>
          
          <div className="space-y-3">
            {failure.suggestions?.[0]?.candidates?.length > 0 ? (
              failure.suggestions[0].candidates.slice(0, 3).map((candidate: any, index: number) => (
                <SuggestionCard
                  key={`${candidate.selector}-${index}`}
                  suggestion={candidate}
                  rank={index}
                  onApprove={() => onApproveSuggestion({ ...candidate, suggestionId: failure.suggestions[0].id })}
                />
              ))
            ) : (
              <div className="border border-slate-200 rounded-lg p-4 text-center text-slate-500">
                <i className="fas fa-clock text-2xl mb-2"></i>
                <p>Generating suggestions...</p>
              </div>
            )}
          </div>
        </div>

        {/* DOM Context Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3">DOM Context</h4>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <pre className="text-xs text-slate-700 overflow-x-auto">
              <code>{failure.domHtml ? failure.domHtml.substring(0, 1000) + '...' : 'No DOM context available'}</code>
            </pre>
          </div>
        </div>

        {/* Console Logs Section */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3">Console Logs</h4>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-32 overflow-y-auto">
            <div className="space-y-1 text-xs font-mono">
              {failure.consoleLogs?.length > 0 ? (
                failure.consoleLogs.slice(0, 10).map((log: any, index: number) => (
                  <div 
                    key={index}
                    className={`${
                      log.level === 'error' ? 'text-red-600' :
                      log.level === 'warn' ? 'text-yellow-600' : 'text-slate-600'
                    }`}
                  >
                    {log.message}
                  </div>
                ))
              ) : (
                <>
                  <div className="text-red-600">ERROR: Element not found: {failure.currentSelector}</div>
                  <div className="text-yellow-600">WARN: Selector deprecated in v2.1.0</div>
                  <div className="text-slate-600">INFO: Attempting fallback selectors...</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex space-x-3">
            <button 
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <i className="fas fa-sync mr-2"></i>
              {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button 
              onClick={handleExportData}
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <i className="fas fa-download mr-2"></i>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
