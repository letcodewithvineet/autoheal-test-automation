import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: {
    suggestionId: string;
    selector: string;
    rationale: string;
    confidence: number;
  } | null;
}

export default function ApprovalModal({ isOpen, onClose, suggestion }: ApprovalModalProps) {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: async (approvalData: {
      suggestionId: string;
      decision: 'approve' | 'reject';
      notes?: string;
      approvedBy: string;
    }) => {
      const response = await apiRequest('POST', '/api/approvals', approvalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Approval Submitted",
        description: "Creating pull request with the approved selector change...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/failures'] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to submit approval",
        variant: "destructive",
      });
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

  if (!suggestion) return null;

  // Extract current selector from the suggestion context
  // This would typically come from the failure data
  const currentSelector = '.login-btn-submit'; // TODO: Get from failure context

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full" data-testid="approval-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">Approve Selector Change</DialogTitle>
          <DialogDescription>
            This will create a PR with the updated selector
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-2">
              Current Selector
            </Label>
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-3 font-mono text-sm text-red-600"
              data-testid="current-selector"
            >
              {currentSelector}
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-2">
              New Selector
            </Label>
            <div 
              className="bg-green-50 border border-green-200 rounded-lg p-3 font-mono text-sm text-green-600"
              data-testid="new-selector"
            >
              {suggestion.selector}
            </div>
          </div>
          
          <div>
            <Label 
              htmlFor="approval-notes"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Notes (Optional)
            </Label>
            <Textarea
              id="approval-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this change..."
              className="w-full"
              data-testid="approval-notes-textarea"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleApprove}
              disabled={approvalMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-confirm-approval"
            >
              {approvalMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating PR...
                </>
              ) : (
                'Create PR'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={approvalMutation.isPending}
              className="flex-1"
              data-testid="button-cancel-approval"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
