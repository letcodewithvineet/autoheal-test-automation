/// <reference types="cypress" />

interface AutoHealConfig {
  apiUrl: string;
  enabled: boolean;
}

const config: AutoHealConfig = {
  apiUrl: Cypress.env('CYPRESS_AUTOHEAL_API_URL') || 'http://localhost:4000',
  enabled: Cypress.env('autoheal') || true
};

// Capture console and network logs
const consoleLogs: any[] = [];
const networkLogs: any[] = [];

// Set up log capture
Cypress.on('window:before:load', (win) => {
  const originalConsoleLog = win.console.log;
  const originalConsoleError = win.console.error;
  const originalConsoleWarn = win.console.warn;

  win.console.log = function (...args) {
    consoleLogs.push({ level: 'log', message: args.join(' '), timestamp: Date.now() });
    originalConsoleLog.apply(win.console, args);
  };

  win.console.error = function (...args) {
    consoleLogs.push({ level: 'error', message: args.join(' '), timestamp: Date.now() });
    originalConsoleError.apply(win.console, args);
  };

  win.console.warn = function (...args) {
    consoleLogs.push({ level: 'warn', message: args.join(' '), timestamp: Date.now() });
    originalConsoleWarn.apply(win.console, args);
  };
});

// Intercept network requests
beforeEach(() => {
  cy.intercept('**', (req) => {
    networkLogs.push({
      method: req.method,
      url: req.url,
      timestamp: Date.now(),
      headers: req.headers
    });
    req.continue();
  });
});

// Handle test failures
afterEach(function () {
  if (this.currentTest?.state === 'failed' && config.enabled) {
    // Capture failure artifacts and send to AutoHeal API
    captureFailureArtifacts(this.currentTest);
  }
  
  // Clear logs for next test
  consoleLogs.length = 0;
  networkLogs.length = 0;
});

function captureFailureArtifacts(test: any) {
  cy.task('log', 'AutoHeal: Capturing failure artifacts...');
  
  // Take screenshot
  const screenshotPath = `failure-${test.title.replace(/\s+/g, '-')}-${Date.now()}`;
  cy.screenshot(screenshotPath);
  
  // Get DOM HTML
  cy.document().then((doc) => {
    const domHtml = doc.documentElement.outerHTML;
    
    // Extract test metadata
    const failureData = {
      runId: Cypress.env('CI_RUN_ID') || `local-${Date.now()}`,
      repo: Cypress.env('GITHUB_REPOSITORY') || 'cypress-demo',
      branch: Cypress.env('GITHUB_REF_NAME') || 'main',
      commit: Cypress.env('GITHUB_SHA') || 'local',
      suite: test.parent.title,
      test: test.title,
      specPath: test.invocationDetails.relativeFile,
      browser: `${Cypress.browser.name} ${Cypress.browser.version}`,
      viewport: `${Cypress.config('viewportWidth')}x${Cypress.config('viewportHeight')}`,
      domHtml,
      consoleLogs,
      networkLogs,
      currentSelector: extractFailedSelector(test.err?.message || ''),
      selectorContext: {
        domPath: '', // Would need to be extracted from error context
        neighbors: [],
        parentElements: []
      },
      errorMessage: test.err?.message || ''
    };
    
    // Send to AutoHeal API
    cy.request({
      method: 'POST',
      url: `${config.apiUrl}/api/failures`,
      body: failureData,
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 201) {
        cy.task('log', `AutoHeal: Failure reported with ID ${response.body.failureId}`);
      } else {
        cy.task('log', `AutoHeal: Failed to report failure - ${response.status}`);
      }
    });
  });
}

function extractFailedSelector(errorMessage: string): string {
  // Try to extract selector from common Cypress error messages
  const selectorMatch = errorMessage.match(/Expected to find element: `(.+?)`,/);
  if (selectorMatch) {
    return selectorMatch[1];
  }
  
  const notFoundMatch = errorMessage.match(/Timed out retrying after \d+ms: Expected to find element: (.+)/);
  if (notFoundMatch) {
    return notFoundMatch[1];
  }
  
  return 'unknown-selector';
}

// Custom command for using selector map
Cypress.Commands.add('sel', (selectorKey: string) => {
  // Load selector map and return the current selector for the key
  cy.readFile('../../shared/selectors/selectors.map.json').then((selectorMap) => {
    const selector = selectorMap[selectorKey];
    if (selector) {
      return cy.get(selector);
    } else {
      throw new Error(`Selector not found in map: ${selectorKey}`);
    }
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      sel(selectorKey: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}
