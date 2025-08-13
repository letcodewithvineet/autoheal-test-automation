import { LLMClient, LLMResponse, LLMCandidate } from './llmClient';

export class MockLLMClient implements LLMClient {
  async rerankCandidates(
    domSnippet: string,
    failedSelector: string,
    candidates: { selector: string; score: number; rationale: string }[],
    intendedAction: string,
    nearbyTexts: string[]
  ): Promise<LLMResponse> {
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock re-ranking logic based on deterministic rules
    const reranked: LLMCandidate[] = candidates
      .map((candidate, index) => {
        let confidence = candidate.score;
        let rationale = candidate.rationale;
        
        // Boost data-testid selectors
        if (candidate.selector.includes('data-testid')) {
          confidence = Math.min(0.95, confidence + 0.1);
          rationale = 'High confidence: data-testid provides excellent stability for automated testing';
        }
        
        // Boost aria attributes
        else if (candidate.selector.includes('aria-')) {
          confidence = Math.min(0.85, confidence + 0.05);
          rationale = 'Good confidence: ARIA attributes are semantic and relatively stable';
        }
        
        // Penalize complex CSS selectors
        else if (candidate.selector.length > 80) {
          confidence *= 0.8;
          rationale = 'Lower confidence: Complex selector may be brittle to DOM changes';
        }
        
        return {
          selector: candidate.selector,
          rationale,
          confidence: Math.round(confidence * 100) / 100
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    
    const explanationOfFailure = this.generateFailureExplanation(failedSelector, candidates);
    
    return {
      ranked: reranked,
      explanationOfFailure
    };
  }
  
  private generateFailureExplanation(
    failedSelector: string, 
    candidates: { selector: string; score: number; rationale: string }[]
  ): string {
    // Analyze the failed selector to provide insights
    if (failedSelector.includes('#') && /\d/.test(failedSelector)) {
      return 'The failed selector appears to use a dynamic ID containing numbers, which may change between test runs.';
    }
    
    if (failedSelector.includes(':nth-child')) {
      return 'The failed selector uses nth-child positioning, which can break when DOM structure changes.';
    }
    
    if (failedSelector.split(' ').length > 4) {
      return 'The failed selector is deeply nested and may be too specific, making it fragile to layout changes.';
    }
    
    if (failedSelector.includes('.') && failedSelector.split('.').length > 3) {
      return 'The failed selector relies on multiple CSS classes, which may change during UI updates.';
    }
    
    return 'The element structure may have changed, making the original selector invalid.';
  }
}
