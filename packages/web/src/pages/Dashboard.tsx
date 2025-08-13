import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import FailureList from "../components/FailureList";
import FailureDetail from "../components/FailureDetail";
import ApproveModal from "../components/ApproveModal";

export default function Dashboard() {
  const [selectedFailureId, setSelectedFailureId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [filters, setFilters] = useState({
    repo: '',
    timeframe: 'week'
  });

  const handleFailureSelect = (failureId: string) => {
    setSelectedFailureId(failureId);
  };

  const handleApproveSuggestion = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setShowApprovalModal(true);
  };

  return (
    <div className="min-h-screen flex bg-slate-50" data-testid="dashboard-container">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <TopBar 
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 overflow-auto">
            <FailureList 
              filters={filters}
              onFailureSelect={handleFailureSelect}
              selectedFailureId={selectedFailureId}
            />
          </div>
          
          {selectedFailureId && (
            <FailureDetail
              failureId={selectedFailureId}
              onClose={() => setSelectedFailureId(null)}
              onApproveSuggestion={handleApproveSuggestion}
            />
          )}
        </div>
      </div>

      <ApproveModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        suggestion={selectedSuggestion}
      />
    </div>
  );
}
