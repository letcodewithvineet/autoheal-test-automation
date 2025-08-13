interface SuggestionCardProps {
  suggestion: {
    selector: string;
    rationale: string;
    confidence: number;
    source: 'heuristic' | 'llm';
    type: string;
  };
  rank: number;
  onApprove: () => void;
  onReject?: () => void;
}

export default function SuggestionCard({ suggestion, rank, onApprove, onReject }: SuggestionCardProps) {
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
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">{Math.round(confidence * 100)}% Confidence</span>;
    } else if (confidence >= 0.6) {
      return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">{Math.round(confidence * 100)}% Confidence</span>;
    } else {
      return <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">{Math.round(confidence * 100)}% Confidence</span>;
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
    <div className={`border rounded-lg p-4 transition-all hover:shadow-sm ${getRankStyle(rank)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-slate-800">{getRankLabel(rank)}</div>
        <div className="flex items-center space-x-2">
          {getConfidenceBadge(suggestion.confidence)}
        </div>
      </div>
      
      <div className={`font-mono text-sm rounded p-2 mb-2 ${
        rank === 0 ? 'bg-white border border-green-200' : 'bg-white border border-slate-200'
      }`}>
        {suggestion.selector}
      </div>
      
      <div className="text-sm text-slate-600 mb-3">
        {suggestion.rationale}
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Source: {suggestion.source === 'llm' ? 'Heuristics + LLM' : 'Heuristics'}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={onApprove}
            className={`text-xs font-medium px-3 py-1 rounded ${
              rank === 0 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1 rounded"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
