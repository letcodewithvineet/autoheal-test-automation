-- AutoHeal Database Initialization
-- This file creates sample data for demonstration

-- Sample failures data
INSERT INTO failures (
  "runId", repo, branch, commit, suite, test, "specPath", browser, viewport,
  "screenshotPath", "domHtml", "consoleLogs", "networkLogs", "currentSelector",
  "selectorContext", "errorMessage", status
) VALUES 
(
  'run-12345',
  'https://github.com/demo-org/frontend-app',
  'main',
  'abc123def',
  'Login Tests',
  'should allow user to log in with valid credentials',
  'cypress/e2e/auth/login.cy.js',
  'Chrome 120.0',
  '1920x1080',
  NULL,
  '<div><form><input data-testid="username" type="text"><input data-testid="password" type="password"><button class="login-btn">Login</button></form></div>',
  '[]'::jsonb,
  '[]'::jsonb,
  'button.submit-btn',
  '{"element": "login button", "action": "click"}'::jsonb,
  'Element not found: button.submit-btn',
  'new'
),
(
  'run-12346',
  'https://github.com/demo-org/e-commerce-app',
  'develop',
  'def456ghi',
  'Product Catalog',
  'should display product details when clicking product card',
  'cypress/e2e/products/catalog.cy.js',
  'Firefox 121.0',
  '1366x768',
  NULL,
  '<div><div class="product-card"><h3 data-testid="product-title">Sample Product</h3><button id="add-to-cart">Add to Cart</button></div></div>',
  '[]'::jsonb,
  '[]'::jsonb,
  '.product-item .price',
  '{"element": "product price", "action": "getText"}'::jsonb,
  'Element not found: .product-item .price',
  'suggested'
),
(
  'run-12347',
  'https://github.com/demo-org/api-service',
  'main',
  'ghi789jkl',
  'API Dashboard',
  'should show metrics chart',
  'cypress/e2e/dashboard/metrics.cy.js',
  'Chrome 120.0',
  '1920x1080',
  NULL,
  '<div><div id="metrics-container"><canvas data-testid="metrics-chart"></canvas></div></div>',
  '[]'::jsonb,
  '[]'::jsonb,
  '#chart-wrapper canvas',
  '{"element": "metrics chart", "action": "should.be.visible"}'::jsonb,
  'Element not found: #chart-wrapper canvas',
  'analyzing'
);

-- Sample suggestions
INSERT INTO suggestions ("failureId", candidates, "topChoice") 
SELECT 
  f.id,
  '[
    {
      "selector": "[data-testid=\"login-btn\"]",
      "type": "heuristic",
      "rationale": "Using data-testid attribute for stable test targeting",
      "confidence": 0.95,
      "source": "data-testid-heuristic"
    },
    {
      "selector": ".login-btn",
      "type": "heuristic", 
      "rationale": "Using existing semantic class name for element identification",
      "confidence": 0.75,
      "source": "semantic-class-heuristic"
    },
    {
      "selector": "button:contains(\"Login\")",
      "type": "ai",
      "rationale": "Text-based selector that targets button by visible text content",
      "confidence": 0.65,
      "source": "openai-gpt4o"
    }
  ]'::jsonb,
  '[data-testid="login-btn"]'
FROM failures f 
WHERE f."currentSelector" = 'button.submit-btn'
LIMIT 1;