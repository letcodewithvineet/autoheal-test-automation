import { JSDOM } from 'jsdom';

export interface TextBasedSelector {
  selector: string;
  type: 'exact-text' | 'partial-text' | 'adjacent-text' | 'aria-text';
  confidence: number;
  nearbyText: string;
}

export class TextProximityDetector {
  generateTextBasedSelectors(domHtml: string, targetElement: Element): TextBasedSelector[] {
    try {
      const dom = new JSDOM(domHtml);
      const document = dom.window.document;
      
      const selectors: TextBasedSelector[] = [];
      
      // Find element by its own text content
      selectors.push(...this.findByElementText(targetElement));
      
      // Find element by nearby text
      selectors.push(...this.findByAdjacentText(targetElement));
      
      // Find element by label association
      selectors.push(...this.findByLabelText(document, targetElement));
      
      // Find element by placeholder text
      selectors.push(...this.findByPlaceholderText(targetElement));
      
      return selectors.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error generating text-based selectors:', error);
      return [];
    }
  }

  private findByElementText(element: Element): TextBasedSelector[] {
    const selectors: TextBasedSelector[] = [];
    const textContent = element.textContent?.trim();
    
    if (textContent && textContent.length > 0 && textContent.length < 50) {
      const tagName = element.tagName.toLowerCase();
      
      // Exact text match
      selectors.push({
        selector: `${tagName}:contains("${textContent}")`,
        type: 'exact-text',
        confidence: 0.9,
        nearbyText: textContent
      });
      
      // XPath alternative for text content
      selectors.push({
        selector: `//${tagName}[text()="${textContent}"]`,
        type: 'exact-text',
        confidence: 0.85,
        nearbyText: textContent
      });
    }
    
    return selectors;
  }

  private findByAdjacentText(element: Element): TextBasedSelector[] {
    const selectors: TextBasedSelector[] = [];
    const tagName = element.tagName.toLowerCase();
    
    // Check previous sibling
    const prevSibling = element.previousElementSibling;
    if (prevSibling) {
      const prevText = this.extractUsefulText(prevSibling);
      if (prevText) {
        selectors.push({
          selector: `*:contains("${prevText}") + ${tagName}`,
          type: 'adjacent-text',
          confidence: 0.7,
          nearbyText: prevText
        });
      }
    }
    
    // Check next sibling
    const nextSibling = element.nextElementSibling;
    if (nextSibling) {
      const nextText = this.extractUsefulText(nextSibling);
      if (nextText) {
        selectors.push({
          selector: `${tagName} + *:contains("${nextText}")`,
          type: 'adjacent-text',
          confidence: 0.65,
          nearbyText: nextText
        });
      }
    }
    
    // Check parent with text
    const parent = element.parentElement;
    if (parent) {
      const parentText = this.extractDirectText(parent);
      if (parentText) {
        selectors.push({
          selector: `*:contains("${parentText}") ${tagName}`,
          type: 'adjacent-text',
          confidence: 0.6,
          nearbyText: parentText
        });
      }
    }
    
    return selectors;
  }

  private findByLabelText(document: Document, element: Element): TextBasedSelector[] {
    const selectors: TextBasedSelector[] = [];
    
    // Check for label association
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        const labelText = label.textContent?.trim();
        if (labelText) {
          selectors.push({
            selector: `label:contains("${labelText}") + ${element.tagName.toLowerCase()}`,
            type: 'aria-text',
            confidence: 0.8,
            nearbyText: labelText
          });
        }
      }
    }
    
    // Check for aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        const labelText = labelElement.textContent?.trim();
        if (labelText) {
          selectors.push({
            selector: `${element.tagName.toLowerCase()}[aria-labelledby="${labelledBy}"]`,
            type: 'aria-text',
            confidence: 0.85,
            nearbyText: labelText
          });
        }
      }
    }
    
    return selectors;
  }

  private findByPlaceholderText(element: Element): TextBasedSelector[] {
    const selectors: TextBasedSelector[] = [];
    
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
      const tagName = element.tagName.toLowerCase();
      selectors.push({
        selector: `${tagName}[placeholder="${placeholder}"]`,
        type: 'exact-text',
        confidence: 0.75,
        nearbyText: placeholder
      });
    }
    
    return selectors;
  }

  private extractUsefulText(element: Element): string | null {
    const textContent = element.textContent?.trim();
    
    if (!textContent || textContent.length === 0) {
      return null;
    }
    
    // Filter out very long text or very short text
    if (textContent.length > 50 || textContent.length < 2) {
      return null;
    }
    
    // Filter out common UI text that's not useful for selection
    const commonTexts = [
      'click', 'submit', 'cancel', 'ok', 'yes', 'no', 'save', 'delete',
      'edit', 'close', 'open', 'next', 'previous', 'back', 'forward'
    ];
    
    if (commonTexts.includes(textContent.toLowerCase())) {
      return null;
    }
    
    return textContent;
  }

  private extractDirectText(element: Element): string | null {
    // Get only direct text content, not from child elements
    const childNodes = Array.from(element.childNodes);
    const textNodes = childNodes.filter(node => node.nodeType === 3); // Text nodes
    
    const directText = textNodes
      .map(node => node.textContent?.trim())
      .filter(text => text && text.length > 0)
      .join(' ')
      .trim();
    
    return this.extractUsefulText({ textContent: directText } as Element);
  }

  findElementsByText(domHtml: string, searchText: string): Element[] {
    try {
      const dom = new JSDOM(domHtml);
      const document = dom.window.document;
      
      const elements: Element[] = [];
      const walker = document.createTreeWalker(
        document.body,
        4, // NodeFilter.SHOW_TEXT
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent?.includes(searchText)) {
          const element = node.parentElement;
          if (element && !elements.includes(element)) {
            elements.push(element);
          }
        }
      }
      
      return elements;
    } catch (error) {
      console.error('Error finding elements by text:', error);
      return [];
    }
  }

  generateCSSSelector(element: Element, nearbyText: string): string {
    const tagName = element.tagName.toLowerCase();
    
    // Try to create a CSS selector that uses text content
    // Note: CSS doesn't have direct text content selection, so this is conceptual
    
    // If the element has classes, combine with pseudo-selectors
    const classes = element.className;
    if (typeof classes === 'string' && classes.trim()) {
      const classList = classes.trim().split(/\s+/).slice(0, 2); // Limit to 2 classes
      return `${tagName}.${classList.join('.')}`;
    }
    
    // Fallback to tag name
    return tagName;
  }

  generateXPathSelector(element: Element, nearbyText: string): string {
    const tagName = element.tagName.toLowerCase();
    
    // Generate XPath that can use text content
    if (element.textContent?.trim() === nearbyText) {
      return `//${tagName}[text()="${nearbyText}"]`;
    }
    
    // XPath for elements containing text
    return `//${tagName}[contains(text(), "${nearbyText}")]`;
  }
}
