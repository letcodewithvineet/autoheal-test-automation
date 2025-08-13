import { SelectorCandidate } from './candidates';

export class SelectorScorer {
  scoreAndRank(candidates: SelectorCandidate[]): SelectorCandidate[] {
    return candidates.map(candidate => ({
      ...candidate,
      score: this.calculateScore(candidate)
    })).sort((a, b) => b.score - a.score);
  }
  
  private calculateScore(candidate: SelectorCandidate): number {
    let score = 0;
    
    // Base scores by type
    switch (candidate.type) {
      case 'data-testid':
        score = 0.95;
        break;
      case 'aria-label':
        score = 0.85;
        break;
      case 'role':
        score = 0.75;
        break;
      case 'anchored-css':
        score = 0.65;
        break;
      case 'xpath':
        score = 0.55;
        break;
      default:
        score = 0.3;
    }
    
    // Penalize dynamic patterns
    if (this.hasDynamicPatterns(candidate.selector)) {
      score *= 0.7;
    }
    
    // Prefer shorter selectors
    const length = candidate.selector.length;
    if (length < 50) {
      score += 0.1;
    } else if (length > 100) {
      score -= 0.1;
    }
    
    // Bonus for specificity indicators
    if (candidate.selector.includes('[data-testid')) {
      score += 0.05;
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }
  
  private hasDynamicPatterns(selector: string): boolean {
    // Check for patterns that might indicate dynamic content
    const dynamicPatterns = [
      /\d{8,}/, // Long numbers (timestamps, IDs)
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/, // UUIDs
      /:nth-child\(\d{3,}\)/, // High nth-child indices
      /random|generated|temp|tmp/i, // Common dynamic class patterns
    ];
    
    return dynamicPatterns.some(pattern => pattern.test(selector));
  }
}
