import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface FailureListProps {
  filters: {
    repo: string;
    timeframe: string;
  };
  onFailureSelect: (failureId: string) => void;
  selectedFailureId: string | null;
}

export default function FailureList({ filters, onFailureSelect, selectedFailureId }: FailureListProps) {
  const { data: failures, isLoading, error } = useQuery({
    queryKey: ['failures', filters],
    queryFn: () => api.getFailures({
      repo: filters.repo || undefined,
      since: getDateFromTimeframe(filters.timeframe)
    }),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 text-center text-red-600">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Failed to load failures</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Recent Failures</h3>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <span>{failures?.length || 0} failures</span>
            <span className="text-slate-400">•</span>
            <span>{failures?.filter(f => f.suggestionCount && f.suggestionCount > 0).length || 0} pending suggestions</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {failures?.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-check-circle text-4xl mb-4 text-green-500"></i>
            <h3 className="text-lg font-medium mb-2">No failures found</h3>
            <p>All tests are passing! 🎉</p>
          </div>
        ) : (
          failures?.map((failure) => (
            <FailureRow
              key={failure.id}
              failure={failure}
              isSelected={selectedFailureId === failure.id}
              onSelect={() => onFailureSelect(failure.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface FailureRowProps {
  failure: any;
  isSelected: boolean;
  onSelect: () => void;
}

function FailureRow({ failure, isSelected, onSelect }: FailureRowProps) {
  const getStatusBadge = () => {
    if (failure.status === 'approved') {
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">1 Approved</span>;
    }
    if (failure.suggestionCount > 0) {
      return <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">{failure.suggestionCount} Suggestions</span>;
    }
    if (failure.status === 'analyzing') {
      return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">Analyzing</span>;
    }
    return <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">Failed</span>;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div
      className={`p-6 hover:bg-slate-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-times text-red-600"></i>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-lg font-semibold text-slate-800">{failure.test}</h4>
            {getStatusBadge()}
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
            <span><i className="fas fa-code-branch mr-1"></i>{failure.repo}</span>
            <span><i className="fas fa-file-code mr-1"></i>{failure.specPath}</span>
            <span><i className="fas fa-globe mr-1"></i>{failure.browser}</span>
            <span><i className="fas fa-clock mr-1"></i>{formatTimeAgo(failure.timestamp)}</span>
          </div>
          <div className="bg-slate-100 rounded-lg p-3 font-mono text-sm">
            <div className="text-slate-600 mb-1">Failed selector:</div>
            <div className="text-red-600">{failure.currentSelector}</div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-2">
          {failure.status === 'analyzing' ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-slate-600">Processing</span>
            </div>
          ) : (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getDateFromTimeframe(timeframe: string): string | undefined {
  const now = new Date();
  switch (timeframe) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}
