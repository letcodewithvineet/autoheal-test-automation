import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  id: string;
  failureId: string;
  test: string;
  candidates: Array<{
    selector: string;
    type: string;
    confidence: number;
    rationale: string;
    source: 'heuristic' | 'ai';
  }>;
  topChoice: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function Suggestions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: suggestions = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ['/api/suggestions'],
  });

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const approveMutation = useMutation({
    mutationFn: (suggestionId: string) => {
      setProcessingIds(prev => new Set(prev).add(suggestionId));
      return apiRequest('POST', '/api/approvals', {
        suggestionId,
        decision: 'approve',
        approvedBy: 'current-user',
        notes: 'Approved from suggestions page'
      });
    },
    onSuccess: (_, suggestionId) => {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/approvals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pull-requests'] });
      toast({
        title: 'Success',
        description: 'Suggestion approved and PR created!',
      });
    },
    onError: (error: any, suggestionId) => {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve suggestion',
        variant: 'destructive',
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (suggestionId: string) => {
      setProcessingIds(prev => new Set(prev).add(suggestionId));
      return apiRequest('POST', '/api/approvals', {
        suggestionId,
        decision: 'reject',
        approvedBy: 'current-user',
        notes: 'Rejected from suggestions page'
      });
    },
    onSuccess: (_, suggestionId) => {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/approvals'] });
      toast({
        title: 'Success',
        description: 'Suggestion rejected',
      });
    },
    onError: (error: any, suggestionId) => {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject suggestion',
        variant: 'destructive',
      });
    }
  });

  const handleApprove = (suggestionId: string) => {
    approveMutation.mutate(suggestionId);
  };

  const handleReject = (suggestionId: string) => {
    rejectMutation.mutate(suggestionId);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">AI Suggestions</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-slate-200 rounded-t-lg"></CardHeader>
              <CardContent className="h-32 bg-slate-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6" data-testid="suggestions-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">AI Suggestions</h2>
        <Badge variant="secondary" data-testid="suggestions-count">
          {suggestions.length} suggestions
        </Badge>
      </div>

      <div className="grid gap-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="border border-slate-200" data-testid={`suggestion-${suggestion.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{suggestion.test}</h3>
                <Badge 
                  variant={suggestion.status === 'pending' ? 'secondary' : 
                          suggestion.status === 'approved' ? 'default' : 'destructive'}
                  data-testid={`status-${suggestion.status}`}
                >
                  {suggestion.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">Top suggestion: {suggestion.topChoice}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestion.candidates.slice(0, 2).map((candidate, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <code className="text-sm font-mono text-blue-600">{candidate.selector}</code>
                      <p className="text-xs text-slate-500 mt-1">{candidate.rationale}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(candidate.confidence * 100)}%
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">{candidate.source}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700" 
                  data-testid={`approve-${suggestion.id}`}
                  onClick={() => handleApprove(suggestion.id)}
                  disabled={processingIds.has(suggestion.id)}
                >
                  <i className="fas fa-check mr-2"></i>
                  {processingIds.has(suggestion.id) ? 'Approving...' : 'Approve'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  data-testid={`reject-${suggestion.id}`}
                  onClick={() => handleReject(suggestion.id)}
                  disabled={processingIds.has(suggestion.id)}
                >
                  <i className="fas fa-times mr-2"></i>
                  {processingIds.has(suggestion.id) ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {suggestions.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <i className="fas fa-lightbulb text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No suggestions yet</h3>
              <p className="text-slate-500">AI suggestions will appear here when test failures are analyzed</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}