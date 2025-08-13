import OpenAI from 'openai';
import { LLMClient, LLMResponse } from './llmClient';

export class OpenAILLMClient implements LLMClient {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async rerankCandidates(
    domSnippet: string,
    failedSelector: string,
    candidates: { selector: string; score: number; rationale: string }[],
    intendedAction: string,
    nearbyTexts: string[]
  ): Promise<LLMResponse> {
    
    const prompt = this.buildPrompt(domSnippet, failedSelector, candidates, intendedAction, nearbyTexts);
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert in web automation and CSS/XPath selectors. Your task is to analyze failing test selectors and recommend the most stable alternatives. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        ranked: result.ranked || [],
        explanationOfFailure: result.explanationOfFailure || "Unable to analyze failure reason"
      };
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to mock behavior
      const mockClient = new (await import('./llmMock')).MockLLMClient();
      return mockClient.rerankCandidates(domSnippet, failedSelector, candidates, intendedAction, nearbyTexts);
    }
  }
  
  private buildPrompt(
    domSnippet: string,
    failedSelector: string,
    candidates: { selector: string; score: number; rationale: string }[],
    intendedAction: string,
    nearbyTexts: string[]
  ): string {
    return `
Analyze this failing Cypress test selector and re-rank the suggested alternatives:

## Context
- **Failed Selector**: ${failedSelector}
- **Intended Action**: ${intendedAction}
- **Nearby Text Content**: ${nearbyTexts.join(', ')}

## DOM Snippet
\`\`\`html
${domSnippet}
\`\`\`

## Selector Candidates
${candidates.map((c, i) => `${i + 1}. **${c.selector}**
   - Current Score: ${c.score}
   - Rationale: ${c.rationale}`).join('\n')}

## Task
Re-rank these candidates and provide your top 3 recommendations. Consider:
1. Stability (resistance to DOM changes)
2. Uniqueness (unlikely to match multiple elements)
3. Semantic meaning (data-testid > aria-label > role > CSS classes)
4. Maintenance burden (simpler is better)

## Response Format
Return JSON in exactly this format:
\`\`\`json
{
  "ranked": [
    {
      "selector": "most_recommended_selector",
      "rationale": "concise explanation in 40 words or less",
      "confidence": 0.95
    },
    {
      "selector": "second_choice_selector", 
      "rationale": "concise explanation in 40 words or less",
      "confidence": 0.78
    },
    {
      "selector": "third_choice_selector",
      "rationale": "concise explanation in 40 words or less", 
      "confidence": 0.65
    }
  ],
  "explanationOfFailure": "Brief explanation of why the original selector failed"
}
\`\`\`
`;
  }
}
