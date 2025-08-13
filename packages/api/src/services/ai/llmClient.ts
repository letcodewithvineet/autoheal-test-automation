export interface LLMCandidate {
  selector: string;
  rationale: string;
  confidence: number;
}

export interface LLMResponse {
  ranked: LLMCandidate[];
  explanationOfFailure: string;
}

export interface LLMClient {
  rerankCandidates(
    domSnippet: string,
    failedSelector: string,
    candidates: { selector: string; score: number; rationale: string }[],
    intendedAction: string,
    nearbyTexts: string[]
  ): Promise<LLMResponse>;
}
