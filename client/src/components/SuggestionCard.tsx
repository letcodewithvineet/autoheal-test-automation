import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SuggestionCardProps {
  suggestion: {
    selector: string;
    rationale: string;
    confidence: number;
    source: 'heuristic' | 'llm';
    type: string;
  };
  rank: number;
  onApprove: (customSelector?: string) => void;
  onReject?: () => void;
}

export default function SuggestionCard({ suggestion, rank, onApprove, onReject }: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customSelector, setCustomSelector] = useState(suggestion.selector);
  const isRecommended = rank === 0;
  const getRankLabel = (rank: number) => {
    switch (rank) {
      case 0: return 'Recommended';
      case 1: return 'Alternative';
      case 2: return 'Fallback';
      default: return `Option ${rank + 1}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 0: return 'bg-green-50 border-green-200';
      case 1: return 'bg-yellow-50 border-yellow-200';
      case 2: return 'bg-slate-50 border-slate-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-100 text-green-800">{Math.round(confidence * 100)}% Confidence</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge className="bg-yellow-100 text-yellow-800">{Math.round(confidence * 100)}% Confidence</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">{Math.round(confidence * 100)}% Confidence</Badge>;
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject();
    } else {
      console.log('Rejecting suggestion:', suggestion.selector);
    }
  };

  return (
    <Card 
      className={`${getRankStyle(rank)} transition-all hover:shadow-sm`}
      data-testid={`suggestion-card-rank-${rank}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="font-medium text-slate-800" data-testid={`suggestion-rank-label-${rank}`}>
            {getRankLabel(rank)}
          </div>
          <div className="flex items-center space-x-2">
            {getConfidenceBadge(suggestion.confidence)}
          </div>
        </div>
        
        {isRecommended && isEditing ? (
          <div className="space-y-2 mb-2">
            <Input
              value={customSelector}
              onChange={(e) => setCustomSelector(e.target.value)}
              className="font-mono text-sm"
              placeholder="Enter custom selector..."
              data-testid={`suggestion-selector-input-${rank}`}
            />
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  setIsEditing(false);
                  if (customSelector.trim()) {
                    // Keep the custom selector
                  } else {
                    setCustomSelector(suggestion.selector);
                  }
                }}
                size="sm"
                variant="outline"
                className="text-xs"
                data-testid={`button-save-selector-${rank}`}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setCustomSelector(suggestion.selector);
                }}
                size="sm"
                variant="ghost"
                className="text-xs"
                data-testid={`button-cancel-edit-${rank}`}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className={`font-mono text-sm rounded p-2 mb-2 relative group ${
              rank === 0 ? 'bg-white border border-green-200' : 'bg-white border border-slate-200'
            }`}
            data-testid={`suggestion-selector-${rank}`}
          >
            <div className="pr-8">{customSelector}</div>
            {isRecommended && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-edit-selector-${rank}`}
              >
                <i className="fas fa-edit text-xs"></i>
              </Button>
            )}
          </div>
        )}
        
        <div className="text-sm text-slate-600 mb-3" data-testid={`suggestion-rationale-${rank}`}>
          {suggestion.rationale}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500" data-testid={`suggestion-source-${rank}`}>
            Source: {suggestion.source === 'llm' ? 'Heuristics + LLM' : 'Heuristics'}
          </span>
          <div className="flex space-x-2">
            <Button
              onClick={() => onApprove(isRecommended && customSelector !== suggestion.selector ? customSelector : undefined)}
              size="sm"
              className={`text-xs font-medium ${
                rank === 0 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              data-testid={`button-approve-${rank}`}
            >
              Approve
            </Button>
            <Button
              onClick={handleReject}
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600 hover:text-slate-800"
              data-testid={`button-reject-${rank}`}
            >
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
