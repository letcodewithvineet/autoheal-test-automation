import { CandidateGenerator } from '../heuristics/candidates';
import { SelectorScorer } from '../heuristics/scoring';
import { LLMClient } from './llmClient';
import { MockLLMClient } from './llmMock';
import { OpenAILLMClient } from './llmOpenAI';
import { env } from '../../utils/env';

export interface SuggestionResult {
  candidates: Array<{
    selector: string;
    type: string;
    rationale: string;
    confidence: number;
    source: 'heuristic' | 'llm';
  }>;
  topChoice: string;
  explanationOfFailure: string;
}

export class SelectorAdvisor {
  private llmClient: LLMClient;
  private candidateGenerator: CandidateGenerator;
  private scorer: SelectorScorer;
  
  constructor() {
    this.candidateGenerator = new CandidateGenerator();
    this.scorer = new SelectorScorer();
    
    // Initialize LLM client based on configuration
    if (env.LLM_PROVIDER === 'openai' && env.LLM_API_KEY) {
      this.llmClient = new OpenAILLMClient(env.LLM_API_KEY);
    } else {
      this.llmClient = new MockLLMClient();
    }
  }
  
  async generateSuggestions(
    domHtml: string,
    failedSelector: string,
    selectorContext: any,
    intendedAction: string = 'click'
  ): Promise<SuggestionResult> {
    
    try {
      // Step 1: Generate candidates using heuristics
      const heuristicCandidates = this.candidateGenerator.generateCandidates(
        domHtml,
        failedSelector,
        selectorContext
      );
      
      // Step 2: Score and rank heuristic candidates
      const scoredCandidates = this.scorer.scoreAndRank(heuristicCandidates);
      
      // Step 3: Use LLM to re-rank and provide insights
      const domSnippet = this.extractRelevantDomSnippet(domHtml, selectorContext);
      const nearbyTexts = this.extractNearbyTexts(domHtml, selectorContext);
      
      const llmResponse = await this.llmClient.rerankCandidates(
        domSnippet,
        failedSelector,
        scoredCandidates.map(c => ({
          selector: c.selector,
          score: c.score,
          rationale: c.rationale
        })),
        intendedAction,
        nearbyTexts
      );
      
      // Step 4: Combine heuristic and LLM results
      const combinedCandidates = [
        ...llmResponse.ranked.slice(0, 3).map(c => ({
          ...c,
          type: this.inferSelectorType(c.selector),
          source: 'llm' as const
        })),
        ...scoredCandidates.slice(0, 2).map(c => ({
          selector: c.selector,
          type: c.type,
          rationale: c.rationale,
          confidence: c.score,
          source: 'heuristic' as const
        }))
      ];
      
      // Remove duplicates and limit to top 5
      const uniqueCandidates = this.removeDuplicateCandidates(combinedCandidates).slice(0, 5);
      
      return {
        candidates: uniqueCandidates,
        topChoice: uniqueCandidates[0]?.selector || '',
        explanationOfFailure: llmResponse.explanationOfFailure
      };
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
      
      // Fallback to heuristics only
      const heuristicCandidates = this.candidateGenerator.generateCandidates(
        domHtml,
        failedSelector,
        selectorContext
      );
      
      const scoredCandidates = this.scorer.scoreAndRank(heuristicCandidates);
      
      return {
        candidates: scoredCandidates.map(c => ({
          selector: c.selector,
          type: c.type,
          rationale: c.rationale,
          confidence: c.score,
          source: 'heuristic' as const
        })).slice(0, 5),
        topChoice: scoredCandidates[0]?.selector || '',
        explanationOfFailure: 'Failed to analyze with AI. Using heuristic analysis only.'
      };
    }
  }
  
  private extractRelevantDomSnippet(domHtml: string, context: any): string {
    // Extract a focused DOM snippet around the target element
    // This is a simplified implementation
    const lines = domHtml.split('\n');
    const contextLines = 10;
    
    // Try to find lines containing selector context
    let startLine = 0;
    let endLine = Math.min(lines.length, contextLines * 2);
    
    if (context.domPath) {
      const pathElements = context.domPath.split(' > ');
      for (let i = 0; i < lines.length; i++) {
        if (pathElements.some(element => lines[i].includes(element))) {
          startLine = Math.max(0, i - contextLines);
          endLine = Math.min(lines.length, i + contextLines);
          break;
        }
      }
    }
    
    return lines.slice(startLine, endLine).join('\n');
  }
  
  private extractNearbyTexts(domHtml: string, context: any): string[] {
    // Extract text content that might be useful for context
    // This is a simplified implementation
    const textRegex = />([^<]+)</g;
    const texts: string[] = [];
    let match;
    
    while ((match = textRegex.exec(domHtml)) !== null) {
      const text = match[1].trim();
      if (text.length > 2 && text.length < 50 && !/^\s*$/.test(text)) {
        texts.push(text);
      }
    }
    
    return texts.slice(0, 5);
  }
  
  private inferSelectorType(selector: string): string {
    if (selector.includes('[data-testid')) return 'data-testid';
    if (selector.includes('[aria-')) return 'aria-label';
    if (selector.includes('[role')) return 'role';
    if (selector.includes('xpath') || selector.includes('//')) return 'xpath';
    return 'css';
  }
  
  private removeDuplicateCandidates(candidates: any[]): any[] {
    const seen = new Set<string>();
    return candidates.filter(c => {
      if (seen.has(c.selector)) {
        return false;
      }
      seen.add(c.selector);
      return true;
    });
  }
}
