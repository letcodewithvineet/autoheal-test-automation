import OpenAI from "openai";
import type { Failure } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// Initialize OpenAI client only if API key is provided (for demo mode compatibility)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface SelectorCandidate {
  selector: string;
  type: "heuristic" | "ai";
  rationale: string;
  confidence: number;
  source: string;
}

export interface SuggestionResult {
  candidates: SelectorCandidate[];
  topChoice: string;
}

export class AIAdvisor {
  /**
   * Generate improved selector suggestions for a failing test
   */
  async generateSuggestions(failure: Failure): Promise<SuggestionResult> {
    try {
      // Generate heuristic-based candidates first
      const heuristicCandidates = this.generateHeuristicCandidates(failure);
      
      // Generate AI-powered candidates
      const aiCandidates = await this.generateAICandidates(failure);
      
      // Combine and rank all candidates
      const allCandidates = [...heuristicCandidates, ...aiCandidates];
      const rankedCandidates = this.rankCandidates(allCandidates, failure);
      
      return {
        candidates: rankedCandidates,
        topChoice: rankedCandidates[0]?.selector || failure.currentSelector
      };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      
      // Fallback to heuristic-only suggestions
      const heuristicCandidates = this.generateHeuristicCandidates(failure);
      return {
        candidates: heuristicCandidates,
        topChoice: heuristicCandidates[0]?.selector || failure.currentSelector
      };
    }
  }

  /**
   * Generate selector candidates using heuristic rules
   */
  private generateHeuristicCandidates(failure: Failure): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];
    const selectorContext = failure.selectorContext as any;
    
    if (!selectorContext) return candidates;

    // Extract DOM elements from the context
    const domElements = this.extractDOMElements(failure.domHtml);
    const targetElement = this.findTargetElement(domElements, failure.currentSelector);
    
    if (!targetElement) return candidates;

    // Priority 1: data-testid attributes
    if (targetElement.getAttribute('data-testid')) {
      candidates.push({
        selector: `[data-testid="${targetElement.getAttribute('data-testid')}"]`,
        type: "heuristic",
        rationale: "Using data-testid attribute for stable test targeting",
        confidence: 0.95,
        source: "data-testid-heuristic"
      });
    }

    // Priority 2: aria-label attributes
    if (targetElement.getAttribute('aria-label')) {
      candidates.push({
        selector: `[aria-label="${targetElement.getAttribute('aria-label')}"]`,
        type: "heuristic",
        rationale: "Using aria-label for accessible and stable selection",
        confidence: 0.85,
        source: "aria-label-heuristic"
      });
    }

    // Priority 3: role-based selectors
    if (targetElement.getAttribute('role')) {
      const role = targetElement.getAttribute('role');
      candidates.push({
        selector: `[role="${role}"]`,
        type: "heuristic",
        rationale: "Using semantic role for robust element identification",
        confidence: 0.75,
        source: "role-heuristic"
      });
    }

    // Priority 4: ID-based selectors (if stable-looking)
    const id = targetElement.getAttribute('id');
    if (id && this.isStableId(id)) {
      candidates.push({
        selector: `#${id}`,
        type: "heuristic",
        rationale: "Using stable-looking ID for direct element targeting",
        confidence: 0.70,
        source: "stable-id-heuristic"
      });
    }

    // Priority 5: Class-based selectors (for semantic classes)
    const classes = targetElement.getAttribute('class')?.split(' ') || [];
    const semanticClass = classes.find(cls => this.isSemanticClass(cls));
    if (semanticClass) {
      candidates.push({
        selector: `.${semanticClass}`,
        type: "heuristic",
        rationale: "Using semantic class name for element identification",
        confidence: 0.60,
        source: "semantic-class-heuristic"
      });
    }

    return candidates;
  }

  /**
   * Generate selector candidates using AI analysis
   */
  private async generateAICandidates(failure: Failure): Promise<SelectorCandidate[]> {
    // Skip AI analysis if OpenAI client not available (demo mode)
    if (!openai) {
      console.log('OpenAI API key not provided - using heuristic-only mode for demo');
      return [];
    }
    
    try {
      const prompt = this.buildAIPrompt(failure);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in web testing and CSS selectors. Analyze failing test selectors and suggest better alternatives that are more stable, specific, and resilient to DOM changes. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return (result.suggestions || []).map((suggestion: any) => ({
        selector: suggestion.selector,
        type: "ai" as const,
        rationale: suggestion.rationale || "AI-generated suggestion",
        confidence: Math.min(0.9, Math.max(0.4, suggestion.confidence || 0.6)),
        source: "openai-gpt4o"
      }));
      
    } catch (error) {
      console.error('Error generating AI candidates:', error);
      return [];
    }
  }

  /**
   * Build prompt for AI analysis
   */
  private buildAIPrompt(failure: Failure): string {
    return `
Analyze this failing Cypress test selector and suggest better alternatives:

**Current Failing Selector:** ${failure.currentSelector}
**Test Context:** ${failure.test} in ${failure.suite}
**Error Message:** ${failure.errorMessage || 'Element not found'}

**DOM Context (relevant section):**
${this.extractRelevantDOM(failure.domHtml, failure.currentSelector)}

**Browser:** ${failure.browser}
**Viewport:** ${failure.viewport}

Please suggest 3-5 alternative selectors that would be more stable and reliable. For each suggestion, provide:
- selector: the actual CSS selector string
- rationale: why this selector is better (be specific)
- confidence: a decimal between 0.4 and 0.9 indicating your confidence

Focus on selectors that:
1. Use semantic attributes (data-testid, aria-label, role)
2. Are less likely to break with UI changes
3. Are specific enough to target the right element
4. Follow testing best practices

Respond in this JSON format:
{
  "suggestions": [
    {
      "selector": "[data-testid='example']",
      "rationale": "Uses dedicated test attribute that won't change with styling",
      "confidence": 0.85
    }
  ]
}
`;
  }

  /**
   * Rank candidates by confidence and stability
   */
  private rankCandidates(candidates: SelectorCandidate[], failure: Failure): SelectorCandidate[] {
    return candidates
      .sort((a, b) => {
        // Primary sort: by confidence
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        
        // Secondary sort: prefer heuristic over AI for equal confidence
        if (a.type === 'heuristic' && b.type === 'ai') return -1;
        if (a.type === 'ai' && b.type === 'heuristic') return 1;
        
        return 0;
      })
      .slice(0, 8); // Limit to top 8 candidates
  }

  /**
   * Extract DOM elements from HTML string
   */
  private extractDOMElements(domHtml: string): Element[] {
    try {
      // Simple DOM parser - in production, consider using jsdom
      const parser = new DOMParser();
      const doc = parser.parseFromString(domHtml, 'text/html');
      return Array.from(doc.querySelectorAll('*'));
    } catch {
      return [];
    }
  }

  /**
   * Find target element based on current selector
   */
  private findTargetElement(elements: Element[], currentSelector: string): Element | null {
    try {
      // This is a simplified implementation
      // In production, you'd want more sophisticated matching
      return elements.find(el => {
        try {
          return el.matches && el.matches(currentSelector);
        } catch {
          return false;
        }
      }) || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract relevant DOM section around the failing selector
   */
  private extractRelevantDOM(domHtml: string, selector: string): string {
    // Extract a focused section of DOM around the target element
    // This is a simplified version - in production, implement smarter context extraction
    const lines = domHtml.split('\n');
    const maxLines = 50;
    
    if (lines.length <= maxLines) {
      return domHtml;
    }
    
    // Find lines containing selector-related content
    const relevantLines = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => {
        const lowerLine = line.toLowerCase();
        return lowerLine.includes('data-testid') || 
               lowerLine.includes('aria-label') ||
               lowerLine.includes('role=') ||
               lowerLine.includes('class=') ||
               lowerLine.includes('id=');
      })
      .slice(0, maxLines);
    
    if (relevantLines.length === 0) {
      return lines.slice(0, maxLines).join('\n');
    }
    
    return relevantLines.map(({ line }) => line).join('\n');
  }

  /**
   * Check if ID looks stable (not auto-generated)
   */
  private isStableId(id: string): boolean {
    // Avoid IDs that look auto-generated
    const unstablePatterns = [
      /^[0-9]+$/,           // Pure numbers
      /^[a-f0-9-]{20,}$/i,  // Long hex strings
      /^mui-\d+$/,          // Material-UI generated IDs
      /^rc_select_\d+$/,    // React component generated IDs
    ];
    
    return !unstablePatterns.some(pattern => pattern.test(id));
  }

  /**
   * Check if class name is semantic (not utility/generated)
   */
  private isSemanticClass(className: string): boolean {
    // Prefer semantic class names over utility classes
    const utilityPatterns = [
      /^[a-f0-9]+$/,          // Hash-like classes
      /^css-[a-z0-9]+$/,      // CSS-in-JS generated
      /^[a-z]+-\d+$/,         // Utility classes like mb-4
      /^(bg|text|p|m|w|h)-/,  // Common utility prefixes
    ];
    
    return !utilityPatterns.some(pattern => pattern.test(className)) && 
           className.length > 2 &&
           !className.includes('-');
  }
}

export const aiAdvisor = new AIAdvisor();