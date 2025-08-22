import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";

interface Approval {
  id: string;
  suggestionId: string;
  test: string;
  originalSelector: string;
  suggestedSelector: string;
  confidence: number;
  rationale: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
}

export default function Approvals() {
  const { data: approvals = [], isLoading } = useQuery<Approval[]>({
    queryKey: ['/api/approvals'],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Approvals</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-slate-200 rounded-t-lg"></CardHeader>
              <CardContent className="h-24 bg-slate-100"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6" data-testid="approvals-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Approvals</h2>
        <Badge variant="secondary" data-testid="approvals-count">
          {approvals.length} items
        </Badge>
      </div>

      <div className="grid gap-4">
        {approvals.map((approval) => (
          <Card key={approval.id} className="border border-slate-200" data-testid={`approval-${approval.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{approval.test}</h3>
                <Badge 
                  variant={approval.status === 'pending' ? 'secondary' : 
                          approval.status === 'approved' ? 'default' : 'destructive'}
                  data-testid={`status-${approval.status}`}
                >
                  {approval.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Selector Change</h4>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-red-600 font-medium">FROM:</span>
                      <code className="text-sm font-mono text-red-700 bg-red-50 px-2 py-1 rounded">
                        {approval.originalSelector}
                      </code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-green-600 font-medium">TO:</span>
                      <code className="text-sm font-mono text-green-700 bg-green-50 px-2 py-1 rounded">
                        {approval.suggestedSelector}
                      </code>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">Rationale</h4>
                  <p className="text-sm text-slate-600">{approval.rationale}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(approval.confidence * 100)}% confidence
                    </Badge>
                    {approval.approvedBy && (
                      <span className="text-xs text-slate-500">
                        Approved by {approval.approvedBy}
                      </span>
                    )}
                  </div>
                  
                  {approval.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" data-testid={`approve-${approval.id}`}>
                        <i className="fas fa-check mr-1"></i>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`reject-${approval.id}`}>
                        <i className="fas fa-times mr-1"></i>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {approvals.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <i className="fas fa-check-circle text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No pending approvals</h3>
              <p className="text-slate-500">Approved suggestions will be listed here for review</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}