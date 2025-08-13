import { JSDOM } from 'jsdom';

export interface SelectorCandidate {
  selector: string;
  type: 'data-testid' | 'aria-label' | 'role' | 'anchored-css' | 'xpath';
  score: number;
  rationale: string;
  source: 'heuristic' | 'llm';
}

export class CandidateGenerator {
  generateCandidates(domHtml: string, failedSelector: string, selectorContext: any): SelectorCandidate[] {
    const dom = new JSDOM(domHtml);
    const document = dom.window.document;
    
    const candidates: SelectorCandidate[] = [];
    
    // Try to find the target element using various strategies
    const targetElement = this.findTargetElement(document, failedSelector, selectorContext);
    
    if (!targetElement) {
      return candidates;
    }
    
    // 1. Preferred attributes (data-testid, aria-label, role)
    candidates.push(...this.generatePreferredAttributeCandidates(targetElement));
    
    // 2. Anchored CSS selectors
    candidates.push(...this.generateAnchoredCssCandidates(targetElement, document));
    
    // 3. Text proximity selectors
    candidates.push(...this.generateTextProximityCandidates(targetElement, document));
    
    return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
  }
  
  private findTargetElement(document: Document, failedSelector: string, context: any): Element | null {
    // Try to find element by context information
    try {
      return document.querySelector(failedSelector);
    } catch {
      // If failed selector is invalid, use context to find element
      return this.findByContext(document, context);
    }
  }
  
  private findByContext(document: Document, context: any): Element | null {
    // Use DOM path and neighbor information to locate element
    if (context.domPath) {
      try {
        return document.querySelector(context.domPath);
      } catch {
        // Fallback strategies
      }
    }
    return null;
  }
  
  private generatePreferredAttributeCandidates(element: Element): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];
    
    // data-testid
    const testId = element.getAttribute('data-testid');
    if (testId) {
      candidates.push({
        selector: `[data-testid="${testId}"]`,
        type: 'data-testid',
        score: 0.95,
        rationale: 'Found data-testid attribute - most stable selector available',
        source: 'heuristic'
      });
    }
    
    // aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      candidates.push({
        selector: `[aria-label="${ariaLabel}"]`,
        type: 'aria-label',
        score: 0.85,
        rationale: 'Found aria-label attribute - good accessibility-based selector',
        source: 'heuristic'
      });
    }
    
    // role
    const role = element.getAttribute('role');
    if (role) {
      candidates.push({
        selector: `[role="${role}"]`,
        type: 'role',
        score: 0.75,
        rationale: 'Found role attribute - semantic selector with good stability',
        source: 'heuristic'
      });
    }
    
    return candidates;
  }
  
  private generateAnchoredCssCandidates(element: Element, document: Document): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];
    
    // Find stable ancestor
    const stableAncestor = this.findStableAncestor(element);
    
    if (stableAncestor) {
      const ancestorSelector = this.generateSelectorForElement(stableAncestor);
      const elementPath = this.getRelativePathToElement(stableAncestor, element);
      
      candidates.push({
        selector: `${ancestorSelector} ${elementPath}`,
        type: 'anchored-css',
        score: 0.65,
        rationale: 'Anchored to stable ancestor with minimal child selector',
        source: 'heuristic'
      });
    }
    
    return candidates;
  }
  
  private generateTextProximityCandidates(element: Element, document: Document): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];
    
    // Find nearby text content
    const nearbyText = this.findNearbyText(element);
    
    if (nearbyText) {
      const tagName = element.tagName.toLowerCase();
      candidates.push({
        selector: `${tagName}:has-text("${nearbyText}")`,
        type: 'xpath',
        score: 0.55,
        rationale: `Located by ${tagName} element containing nearby text "${nearbyText}"`,
        source: 'heuristic'
      });
    }
    
    return candidates;
  }
  
  private findStableAncestor(element: Element): Element | null {
    let current = element.parentElement;
    
    while (current) {
      // Check for stable attributes
      if (
        current.getAttribute('data-testid') ||
        current.getAttribute('role') ||
        ['header', 'main', 'nav', 'footer', 'aside'].includes(current.tagName.toLowerCase())
      ) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }
  
  private generateSelectorForElement(element: Element): string {
    const testId = element.getAttribute('data-testid');
    if (testId) return `[data-testid="${testId}"]`;
    
    const role = element.getAttribute('role');
    if (role) return `[role="${role}"]`;
    
    return element.tagName.toLowerCase();
  }
  
  private getRelativePathToElement(ancestor: Element, target: Element): string {
    // Generate a minimal path from ancestor to target
    const path: string[] = [];
    let current = target;
    
    while (current && current !== ancestor) {
      const tagName = current.tagName.toLowerCase();
      const index = Array.from(current.parentElement?.children || []).indexOf(current) + 1;
      path.unshift(`${tagName}:nth-child(${index})`);
      current = current.parentElement!;
    }
    
    return path.join(' > ');
  }
  
  private findNearbyText(element: Element): string | null {
    // Look for text in the element itself
    const elementText = element.textContent?.trim();
    if (elementText && elementText.length > 0 && elementText.length < 50) {
      return elementText;
    }
    
    // Look for text in nearby siblings
    const siblings = Array.from(element.parentElement?.children || []);
    const elementIndex = siblings.indexOf(element);
    
    // Check previous sibling
    if (elementIndex > 0) {
      const prevSibling = siblings[elementIndex - 1];
      const prevText = prevSibling.textContent?.trim();
      if (prevText && prevText.length > 0 && prevText.length < 30) {
        return prevText;
      }
    }
    
    // Check next sibling
    if (elementIndex < siblings.length - 1) {
      const nextSibling = siblings[elementIndex + 1];
      const nextText = nextSibling.textContent?.trim();
      if (nextText && nextText.length > 0 && nextText.length < 30) {
        return nextText;
      }
    }
    
    return null;
  }
}
