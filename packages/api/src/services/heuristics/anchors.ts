import { JSDOM } from 'jsdom';

export interface AnchorPoint {
  element: Element;
  selector: string;
  stability: number;
  type: 'semantic' | 'attribute' | 'structural';
}

export class AnchorDetector {
  findStableAnchors(domHtml: string, targetElement?: Element): AnchorPoint[] {
    try {
      const dom = new JSDOM(domHtml);
      const document = dom.window.document;
      
      const anchors: AnchorPoint[] = [];
      
      // Find semantic landmarks
      anchors.push(...this.findSemanticLandmarks(document));
      
      // Find elements with stable attributes
      anchors.push(...this.findStableAttributeElements(document));
      
      // Find structural anchors
      anchors.push(...this.findStructuralAnchors(document));
      
      // Sort by stability score
      return anchors.sort((a, b) => b.stability - a.stability);
    } catch (error) {
      console.error('Error finding stable anchors:', error);
      return [];
    }
  }

  private findSemanticLandmarks(document: Document): AnchorPoint[] {
    const landmarks = ['header', 'main', 'nav', 'footer', 'aside', 'section', 'article'];
    const anchors: AnchorPoint[] = [];
    
    landmarks.forEach(tagName => {
      const elements = document.getElementsByTagName(tagName);
      for (const element of elements) {
        anchors.push({
          element,
          selector: tagName,
          stability: 0.9,
          type: 'semantic'
        });
      }
    });
    
    return anchors;
  }

  private findStableAttributeElements(document: Document): AnchorPoint[] {
    const anchors: AnchorPoint[] = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      // data-testid attributes
      const testId = element.getAttribute('data-testid');
      if (testId) {
        anchors.push({
          element,
          selector: `[data-testid="${testId}"]`,
          stability: 0.95,
          type: 'attribute'
        });
      }
      
      // role attributes
      const role = element.getAttribute('role');
      if (role && this.isStableRole(role)) {
        anchors.push({
          element,
          selector: `[role="${role}"]`,
          stability: 0.8,
          type: 'attribute'
        });
      }
      
      // aria-label attributes
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        anchors.push({
          element,
          selector: `[aria-label="${ariaLabel}"]`,
          stability: 0.75,
          type: 'attribute'
        });
      }
      
      // Stable IDs (non-dynamic)
      const id = element.getAttribute('id');
      if (id && this.isStableId(id)) {
        anchors.push({
          element,
          selector: `#${id}`,
          stability: 0.7,
          type: 'attribute'
        });
      }
    });
    
    return anchors;
  }

  private findStructuralAnchors(document: Document): AnchorPoint[] {
    const anchors: AnchorPoint[] = [];
    
    // Find elements that are likely to be stable containers
    const containers = document.querySelectorAll('div, section, article, main');
    
    containers.forEach(element => {
      const classes = element.className;
      if (typeof classes === 'string' && this.hasStableClasses(classes)) {
        const stableClasses = this.extractStableClasses(classes);
        if (stableClasses.length > 0) {
          anchors.push({
            element,
            selector: `.${stableClasses.join('.')}`,
            stability: 0.6,
            type: 'structural'
          });
        }
      }
    });
    
    return anchors;
  }

  private isStableRole(role: string): boolean {
    const stableRoles = [
      'banner', 'navigation', 'main', 'contentinfo', 'complementary',
      'button', 'link', 'tab', 'tabpanel', 'dialog', 'menu', 'menuitem'
    ];
    return stableRoles.includes(role);
  }

  private isStableId(id: string): boolean {
    // Check if ID looks dynamic (contains numbers, UUIDs, etc.)
    const dynamicPatterns = [
      /\d{8,}/, // Long numbers
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/, // UUIDs
      /random|generated|temp|tmp/i, // Dynamic keywords
      /_\d+$/, // Trailing numbers
    ];
    
    return !dynamicPatterns.some(pattern => pattern.test(id));
  }

  private hasStableClasses(className: string): boolean {
    const classes = className.split(' ').filter(c => c.trim());
    return classes.some(cls => this.isStableClass(cls));
  }

  private isStableClass(className: string): boolean {
    // Avoid dynamic classes
    const dynamicPatterns = [
      /\d{8,}/, // Long numbers
      /random|generated|temp|tmp/i, // Dynamic keywords
      /^css-[a-z0-9]+$/i, // CSS-in-JS generated classes
      /^[a-z0-9]{8,}$/i, // Hash-like classes
    ];
    
    // Prefer semantic class names
    const semanticPatterns = [
      /header|footer|nav|sidebar|main|content/i,
      /button|input|form|modal|dialog/i,
      /container|wrapper|box|panel/i
    ];
    
    const isDynamic = dynamicPatterns.some(pattern => pattern.test(className));
    const isSemantic = semanticPatterns.some(pattern => pattern.test(className));
    
    return !isDynamic && (isSemantic || className.length > 3);
  }

  private extractStableClasses(className: string): string[] {
    const classes = className.split(' ').filter(c => c.trim());
    return classes.filter(cls => this.isStableClass(cls)).slice(0, 3); // Limit to 3 classes
  }

  findBestAnchorForElement(domHtml: string, targetElement: Element): AnchorPoint | null {
    const anchors = this.findStableAnchors(domHtml);
    
    // Find the closest stable anchor that contains the target element
    for (const anchor of anchors) {
      if (anchor.element.contains(targetElement)) {
        return anchor;
      }
    }
    
    // If no containing anchor found, find the closest one
    let closestAnchor: AnchorPoint | null = null;
    let minDistance = Infinity;
    
    for (const anchor of anchors) {
      const distance = this.calculateElementDistance(anchor.element, targetElement);
      if (distance < minDistance) {
        minDistance = distance;
        closestAnchor = anchor;
      }
    }
    
    return closestAnchor;
  }

  private calculateElementDistance(element1: Element, element2: Element): number {
    // Simple distance calculation based on DOM tree traversal
    // This is a simplified implementation
    
    const rect1 = element1.getBoundingClientRect?.() || { top: 0, left: 0 };
    const rect2 = element2.getBoundingClientRect?.() || { top: 0, left: 0 };
    
    return Math.sqrt(
      Math.pow(rect2.top - rect1.top, 2) + 
      Math.pow(rect2.left - rect1.left, 2)
    );
  }

  generateAnchoredSelector(anchor: AnchorPoint, targetElement: Element): string {
    try {
      const path = this.getPathFromAnchorToTarget(anchor.element, targetElement);
      return `${anchor.selector} ${path}`;
    } catch (error) {
      console.error('Error generating anchored selector:', error);
      return anchor.selector;
    }
  }

  private getPathFromAnchorToTarget(anchor: Element, target: Element): string {
    const path: string[] = [];
    let current = target;
    
    while (current && current !== anchor && current.parentElement) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current) + 1;
      
      path.unshift(`${tagName}:nth-child(${index})`);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
}
