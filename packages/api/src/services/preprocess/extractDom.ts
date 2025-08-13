import { JSDOM } from 'jsdom';

export interface DOMAnalysis {
  elementCount: number;
  formElements: number;
  interactiveElements: number;
  hasTestIds: boolean;
  hasAriaLabels: boolean;
  depth: number;
  classes: string[];
  ids: string[];
}

export class DOMExtractor {
  extractMetadata(htmlContent: string): DOMAnalysis {
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      const analysis: DOMAnalysis = {
        elementCount: 0,
        formElements: 0,
        interactiveElements: 0,
        hasTestIds: false,
        hasAriaLabels: false,
        depth: 0,
        classes: [],
        ids: []
      };

      this.analyzeElement(document.documentElement, analysis, 0);
      
      return analysis;
    } catch (error) {
      console.error('Error extracting DOM metadata:', error);
      return {
        elementCount: 0,
        formElements: 0,
        interactiveElements: 0,
        hasTestIds: false,
        hasAriaLabels: false,
        depth: 0,
        classes: [],
        ids: []
      };
    }
  }

  private analyzeElement(element: Element, analysis: DOMAnalysis, currentDepth: number) {
    analysis.elementCount++;
    analysis.depth = Math.max(analysis.depth, currentDepth);

    // Check for test IDs
    if (element.getAttribute('data-testid')) {
      analysis.hasTestIds = true;
    }

    // Check for ARIA labels
    if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) {
      analysis.hasAriaLabels = true;
    }

    // Count form elements
    const tagName = element.tagName.toLowerCase();
    if (['input', 'textarea', 'select', 'button'].includes(tagName)) {
      analysis.formElements++;
    }

    // Count interactive elements
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName) || 
        element.getAttribute('onclick') || 
        element.getAttribute('role') === 'button') {
      analysis.interactiveElements++;
    }

    // Collect classes and IDs
    const className = element.className;
    if (className && typeof className === 'string') {
      const classes = className.split(' ').filter(c => c.trim());
      analysis.classes.push(...classes);
    }

    const id = element.id;
    if (id) {
      analysis.ids.push(id);
    }

    // Recursively analyze children
    for (const child of element.children) {
      this.analyzeElement(child, analysis, currentDepth + 1);
    }
  }

  extractElementContext(htmlContent: string, targetSelector: string): {
    element: string | null;
    parent: string | null;
    siblings: string[];
    children: string[];
  } {
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      let targetElement: Element | null = null;
      
      try {
        targetElement = document.querySelector(targetSelector);
      } catch {
        // If selector is invalid, try to find element by other means
        targetElement = this.findElementByContext(document, targetSelector);
      }

      if (!targetElement) {
        return {
          element: null,
          parent: null,
          siblings: [],
          children: []
        };
      }

      return {
        element: targetElement.outerHTML,
        parent: targetElement.parentElement?.outerHTML || null,
        siblings: Array.from(targetElement.parentElement?.children || [])
          .filter(el => el !== targetElement)
          .map(el => el.outerHTML),
        children: Array.from(targetElement.children).map(el => el.outerHTML)
      };
    } catch (error) {
      console.error('Error extracting element context:', error);
      return {
        element: null,
        parent: null,
        siblings: [],
        children: []
      };
    }
  }

  private findElementByContext(document: Document, selector: string): Element | null {
    // Try to extract tag name and attributes from failed selector
    const tagMatch = selector.match(/^([a-zA-Z]+)/);
    const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/g);
    const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/);

    if (tagMatch) {
      const tagName = tagMatch[1];
      const elements = document.getElementsByTagName(tagName);
      
      // If only one element of this tag type, return it
      if (elements.length === 1) {
        return elements[0];
      }
    }

    return null;
  }

  sanitizeHTML(htmlContent: string): string {
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      // Remove script tags
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      // Remove event handlers
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        // Remove event handler attributes
        const attributes = Array.from(element.attributes);
        attributes.forEach(attr => {
          if (attr.name.startsWith('on')) {
            element.removeAttribute(attr.name);
          }
        });
      });

      return document.documentElement.outerHTML;
    } catch (error) {
      console.error('Error sanitizing HTML:', error);
      return htmlContent; // Return original if sanitization fails
    }
  }
}
