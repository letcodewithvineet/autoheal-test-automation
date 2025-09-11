import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import FailureList from "@/components/FailureList";
import FailureDetail from "@/components/FailureDetail";
import ApprovalModal from "@/components/ApprovalModal";

// Add error boundary for better debugging
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800">Something went wrong:</h2>
      <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
    </div>
  );
}

export default function Dashboard() {
  const [selectedFailureId, setSelectedFailureId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [filters, setFilters] = useState({
    repo: 'all',
    timeframe: 'all' // Show all failures by default instead of just last week
  });

  const handleFailureSelect = (failureId: string) => {
    setSelectedFailureId(failureId);
  };

  const handleApproveSuggestion = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setShowApprovalModal(true);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen flex bg-slate-50" data-testid="dashboard-container">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Sidebar />
        </ErrorBoundary>
        
        <div className="flex-1 flex flex-col">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <TopBar 
              filters={filters}
              onFiltersChange={setFilters}
              data-testid="dashboard-topbar"
            />
          </ErrorBoundary>
          
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6 overflow-auto">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <FailureList 
                  filters={filters}
                  onFailureSelect={handleFailureSelect}
                  selectedFailureId={selectedFailureId}
                  data-testid="failure-list"
                />
              </ErrorBoundary>
            </div>
            
            {selectedFailureId && (
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <FailureDetail
                  failureId={selectedFailureId}
                  onClose={() => setSelectedFailureId(null)}
                  onApproveSuggestion={handleApproveSuggestion}
                  data-testid="failure-detail-panel"
                />
              </ErrorBoundary>
            )}
          </div>
        </div>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ApprovalModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            suggestion={selectedSuggestion}
            data-testid="approval-modal"
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
