import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: {
    suggestionId: string;
    selector: string;
    rationale: string;
    confidence: number;
  } | null;
}

export default function ApproveModal({ isOpen, onClose, suggestion }: ApproveModalProps) {
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: (approvalData: {
      suggestionId: string;
      decision: 'approve' | 'reject';
      notes?: string;
      approvedBy: string;
    }) => api.createApproval(approvalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failures'] });
      queryClient.invalidateQueries({ queryKey: ['failure'] });
      handleClose();
    },
  });

  const handleApprove = () => {
    if (!suggestion) return;
    
    approvalMutation.mutate({
      suggestionId: suggestion.suggestionId,
      decision: 'approve',
      notes: notes.trim() || undefined,
      approvedBy: 'current-user', // TODO: Get from auth context
    });
  };

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  if (!isOpen || !suggestion) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Approve Selector Change</h3>
          <p className="text-slate-600 text-sm mt-1">This will create a PR with the updated selector</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Selector
            </label>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 font-mono text-sm text-red-600">
              .login-btn-submit
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Selector
            </label>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 font-mono text-sm text-green-600">
              {suggestion.selector}
            </div>
          </div>
          
          <div>
            <label 
              htmlFor="approval-notes"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Notes (Optional)
            </label>
            <textarea
              id="approval-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this change..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleApprove}
              disabled={approvalMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {approvalMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"></div>
                  Creating PR...
                </>
              ) : (
                'Create PR'
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={approvalMutation.isPending}
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
