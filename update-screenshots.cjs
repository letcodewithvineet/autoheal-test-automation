const { Pool } = require('@neondatabase/serverless');

async function updateFailuresWithScreenshots() {
  console.log('🔄 Updating existing failures with e-commerce screenshots...\n');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Update specific failures with screenshot paths
    const updates = [
      {
        repo: 'frontend-app',
        suite: 'authentication',
        screenshotPath: '/cypress/screenshots/Cypress_login_test_failure_screenshot_8d07a0ac.png'
      },
      {
        repo: 'e-commerce-app',
        suite: 'shopping',
        screenshotPath: '/cypress/screenshots/ecommerce/E-commerce_product_page_test_failure_cae6a38e.png'
      },
      {
        repo: 'api-service',
        suite: 'tables',
        screenshotPath: '/cypress/screenshots/Cypress_dashboard_test_failure_screenshot_c1991408.png'
      }
    ];

    for (const update of updates) {
      const result = await pool.query(
        `UPDATE failures 
         SET screenshot_path = $1 
         WHERE repo = $2 AND suite = $3`,
        [update.screenshotPath, update.repo, update.suite]
      );
      
      console.log(`✅ Updated ${result.rowCount} failure(s) for ${update.repo}/${update.suite}`);
      console.log(`   📸 Screenshot: ${update.screenshotPath.split('/').pop()}`);
    }

    // Add 3 new e-commerce failures with screenshots
    console.log('\n📋 Adding new e-commerce failures...');
    
    const newFailures = [
      {
        run_id: `ecom-cart-${Date.now()}`,
        repo: 'e-commerce-app',
        branch: 'feature/cart-management', 
        commit: 'cart456def',
        suite: 'shopping-cart',
        test: 'update item quantity in shopping cart',
        spec_path: 'cypress/e2e/ecommerce/shopping-cart.cy.js',
        browser: 'chrome',
        viewport: '1920x1080',
        screenshot_path: '/cypress/screenshots/ecommerce/E-commerce_shopping_cart_test_failure_51518982.png',
        dom_html: `<div class="shopping-cart">
  <div class="cart-items">
    <div class="cart-item">
      <div class="item-details">
        <h3>Wireless Mouse</h3>
        <div class="item-price">$49.99</div>
      </div>
      <div class="quantity-controls">
        <button class="qty-decrease">-</button>
        <input class="quantity-input" value="2" />
        <button class="qty-increase">+</button>
      </div>
      <button class="remove-item">Remove</button>
    </div>
  </div>
  <div class="cart-summary">
    <div class="total-price">$99.98</div>
    <button class="proceed-checkout">Proceed to Checkout</button>
  </div>
</div>`,
        console_logs: JSON.stringify([
          { level: 'error', message: 'AssertionError: Expected to find element: [data-testid="item-quantity-input"]', timestamp: Date.now() }
        ]),
        network_logs: JSON.stringify([
          { method: 'GET', url: '/api/cart', status: 200, timestamp: Date.now() },
          { method: 'PUT', url: '/api/cart/item/67890', status: 0, timestamp: Date.now() }
        ]),
        current_selector: '[data-testid="item-quantity-input"]',
        selector_context: JSON.stringify({
          element: 'input',
          type: 'number',
          value: '2',
          className: 'quantity-input',
          position: { x: 250, y: 300 }
        }),
        error_message: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="item-quantity-input"], but never found it.',
        status: 'new',
        timestamp: new Date().toISOString()
      },
      {
        run_id: `ecom-checkout-${Date.now()}`,
        repo: 'e-commerce-app', 
        branch: 'feature/checkout-flow',
        commit: 'checkout789ghi',
        suite: 'checkout',
        test: 'complete purchase with credit card payment',
        spec_path: 'cypress/e2e/ecommerce/checkout.cy.js',
        browser: 'chrome',
        viewport: '1920x1080',
        screenshot_path: '/cypress/screenshots/ecommerce/E-commerce_checkout_page_test_failure_a2c49557.png',
        dom_html: `<div class="checkout-page">
  <div class="billing-section">
    <h2>Billing Information</h2>
    <form class="billing-form">
      <input class="first-name" placeholder="First Name" />
      <input class="last-name" placeholder="Last Name" />
      <input class="email-address" placeholder="Email" />
      <input class="billing-address" placeholder="Address" />
    </form>
  </div>
  <div class="payment-section">
    <h2>Payment Method</h2>
    <div class="payment-options">
      <input type="radio" class="payment-credit" value="credit" />
      <label>Credit Card</label>
      <input type="radio" class="payment-paypal" value="paypal" />
      <label>PayPal</label>
    </div>
    <button class="submit-order">Complete Purchase</button>
  </div>
</div>`,
        console_logs: JSON.stringify([
          { level: 'error', message: 'AssertionError: Expected to find element: [data-testid="billing-address-form"]', timestamp: Date.now() }
        ]),
        network_logs: JSON.stringify([
          { method: 'GET', url: '/api/checkout/init', status: 200, timestamp: Date.now() },
          { method: 'POST', url: '/api/orders/create', status: 0, timestamp: Date.now() }
        ]),
        current_selector: '[data-testid="billing-address-form"]',
        selector_context: JSON.stringify({
          element: 'form',
          className: 'billing-form',
          position: { x: 100, y: 200 }
        }),
        error_message: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="billing-address-form"], but never found it.',
        status: 'new',
        timestamp: new Date().toISOString()
      }
    ];

    for (const failure of newFailures) {
      const result = await pool.query(`
        INSERT INTO failures (
          run_id, repo, branch, commit, suite, test, spec_path, browser, viewport, 
          screenshot_path, dom_html, console_logs, network_logs, current_selector, 
          selector_context, error_message, status, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id, test
      `, [
        failure.run_id, failure.repo, failure.branch, failure.commit, failure.suite, 
        failure.test, failure.spec_path, failure.browser, failure.viewport,
        failure.screenshot_path, failure.dom_html, failure.console_logs, failure.network_logs,
        failure.current_selector, failure.selector_context, failure.error_message, 
        failure.status, failure.timestamp
      ]);
      
      console.log(`✅ Added new failure: ${result.rows[0].test}`);
      console.log(`   📸 Screenshot: ${failure.screenshot_path.split('/').pop()}`);
    }

    console.log('\n🎯 Database Update Complete!');
    console.log('📊 Summary:');
    console.log(`   • Updated existing failures with screenshot paths`);
    console.log(`   • Added new e-commerce failures with real screenshots`);
    console.log(`   • Dashboard will now display screenshots in failure details`);

  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    await pool.end();
  }
}

module.exports = { updateFailuresWithScreenshots };

if (require.main === module) {
  updateFailuresWithScreenshots().catch(console.error);
}