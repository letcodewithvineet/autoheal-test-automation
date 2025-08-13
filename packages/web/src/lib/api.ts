const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

export interface Failure {
  id: string;
  runId: string;
  repo: string;
  branch: string;
  commit: string;
  suite: string;
  test: string;
  specPath: string;
  browser: string;
  viewport: string;
  timestamp: string;
  screenshotPath?: string;
  screenshotGridfsId?: string;
  domHtml: string;
  consoleLogs: any[];
  networkLogs: any[];
  currentSelector: string;
  selectorContext: any;
  errorMessage?: string;
  status: string;
  suggestionCount?: number;
  suggestions?: Suggestion[];
}

export interface Suggestion {
  id: string;
  failureId: string;
  candidates: Array<{
    selector: string;
    type: string;
    rationale: string;
    confidence: number;
    source: 'heuristic' | 'llm';
  }>;
  topChoice: string;
  explanationOfFailure: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  suggestionId: string;
  approvedBy: string;
  decision: 'approve' | 'reject';
  notes?: string;
  createdAt: string;
}

export const api = {
  // Failures
  async getFailures(filters?: { repo?: string; status?: string; since?: string }) {
    const params = new URLSearchParams();
    if (filters?.repo) params.append('repo', filters.repo);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.since) params.append('since', filters.since);
    
    const url = `/api/failures${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiRequest('GET', url);
    return response.json() as Promise<Failure[]>;
  },

  async getFailure(id: string) {
    const response = await apiRequest('GET', `/api/failures/${id}`);
    return response.json() as Promise<Failure>;
  },

  async submitFailure(failure: Omit<Failure, 'id' | 'timestamp' | 'status'>) {
    const response = await apiRequest('POST', '/api/failures', failure);
    return response.json() as Promise<{ failureId: string }>;
  },

  async regenerateSuggestions(failureId: string) {
    const response = await apiRequest('POST', `/api/failures/${failureId}/suggest`);
    return response.json();
  },

  // Suggestions
  async getSuggestions(failureId: string) {
    const response = await apiRequest('GET', `/api/suggestions/${failureId}`);
    return response.json() as Promise<Suggestion[]>;
  },

  // Approvals
  async createApproval(approval: {
    suggestionId: string;
    decision: 'approve' | 'reject';
    notes?: string;
    approvedBy: string;
  }) {
    const response = await apiRequest('POST', '/api/approvals', approval);
    return response.json() as Promise<Approval>;
  },

  // Git/PR operations
  async retryPR(suggestionId: string) {
    const response = await apiRequest('POST', `/api/git/pr/${suggestionId}/retry`);
    return response.json();
  },

  // Selectors
  async getSelectors(page: string) {
    const response = await apiRequest('GET', `/api/selectors/${page}`);
    return response.json();
  },
};
