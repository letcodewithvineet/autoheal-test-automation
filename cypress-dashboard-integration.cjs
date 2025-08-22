const http = require('http');

// Real-time E-commerce Failure Submission to AutoHeal Dashboard
async function submitEcommerceFailuresToDashboard() {
  console.log('📡 Submitting E-commerce Failures to AutoHeal Dashboard...\n');

  const ecommerceFailures = [
    {
      runId: `run-ecom-realtime-product-${Date.now()}`,
      repo: 'e-commerce-app',
      branch: 'feature/product-catalog',
      commit: 'ecom123abc',
      suite: 'product-catalog',
      test: 'add to cart functionality on product page',
      specPath: 'cypress/e2e/ecommerce/product-page.cy.js',
      browser: 'chrome',
      viewport: '1920x1080',
      screenshotPath: '/cypress/screenshots/ecommerce/E-commerce_product_page_test_failure_cae6a38e.png',
      domHtml: `<div class="product-page">
  <div class="product-info">
    <h1 class="product-title">Premium Wireless Headphones</h1>
    <div class="product-price">$299.99</div>
    <div class="product-actions">
      <button class="add-to-cart-btn">Add to Cart</button>
      <button class="buy-now-btn">Buy Now</button>
    </div>
  </div>
  <div class="product-reviews">
    <button class="review-submit">Submit Review</button>
  </div>
</div>`,
      consoleLogs: [
        { level: 'error', message: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="add-to-cart-btn"], but never found it.', timestamp: Date.now() }
      ],
      networkLogs: [
        { method: 'GET', url: '/api/products/12345', status: 200, timestamp: Date.now() },
        { method: 'POST', url: '/api/cart/add', status: 0, timestamp: Date.now() }
      ],
      currentSelector: '[data-testid="add-to-cart-btn"]',
      selectorContext: {
        element: 'button',
        text: 'Add to Cart',
        className: 'add-to-cart-btn',
        position: { x: 300, y: 450 }
      },
      errorMessage: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="add-to-cart-btn"], but never found it.',
      status: 'new'
    },
    {
      runId: `run-ecom-realtime-cart-${Date.now()}`,
      repo: 'e-commerce-app',
      branch: 'feature/cart-management',
      commit: 'cart456def',
      suite: 'shopping-cart',
      test: 'update item quantity in shopping cart',
      specPath: 'cypress/e2e/ecommerce/shopping-cart.cy.js',
      browser: 'chrome',
      viewport: '1920x1080',
      screenshotPath: '/cypress/screenshots/ecommerce/E-commerce_shopping_cart_test_failure_51518982.png',
      domHtml: `<div class="shopping-cart">
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
      consoleLogs: [
        { level: 'error', message: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="item-quantity-input"], but never found it.', timestamp: Date.now() }
      ],
      networkLogs: [
        { method: 'GET', url: '/api/cart', status: 200, timestamp: Date.now() },
        { method: 'PUT', url: '/api/cart/item/67890', status: 0, timestamp: Date.now() }
      ],
      currentSelector: '[data-testid="item-quantity-input"]',
      selectorContext: {
        element: 'input',
        type: 'number',
        value: '2',
        className: 'quantity-input',
        position: { x: 250, y: 300 }
      },
      errorMessage: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="item-quantity-input"], but never found it.',
      status: 'new'
    },
    {
      runId: `run-ecom-realtime-checkout-${Date.now()}`,
      repo: 'e-commerce-app',
      branch: 'feature/checkout-flow',
      commit: 'checkout789ghi',
      suite: 'checkout',
      test: 'complete purchase with credit card payment',
      specPath: 'cypress/e2e/ecommerce/checkout.cy.js',
      browser: 'chrome',
      viewport: '1920x1080',
      screenshotPath: '/cypress/screenshots/ecommerce/E-commerce_checkout_page_test_failure_a2c49557.png',
      domHtml: `<div class="checkout-page">
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
      consoleLogs: [
        { level: 'error', message: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="billing-address-form"], but never found it.', timestamp: Date.now() }
      ],
      networkLogs: [
        { method: 'GET', url: '/api/checkout/init', status: 200, timestamp: Date.now() },
        { method: 'POST', url: '/api/orders/create', status: 0, timestamp: Date.now() }
      ],
      currentSelector: '[data-testid="billing-address-form"]',
      selectorContext: {
        element: 'form',
        className: 'billing-form',
        position: { x: 100, y: 200 }
      },
      errorMessage: 'AssertionError: Timed out retrying after 5000ms: Expected to find element: [data-testid="billing-address-form"], but never found it.',
      status: 'new'
    }
  ];

  // Submit each failure to the API
  for (let i = 0; i < ecommerceFailures.length; i++) {
    const failure = ecommerceFailures[i];
    
    console.log(`📋 Submitting Test ${i + 1}/3: ${failure.test}`);
    
    try {
      // Real API call to submit the failure
      const postData = JSON.stringify(failure);
      
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/failures',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log(`   ✅ Response: ${res.statusCode} - ${data.substring(0, 100)}...`);
            resolve(data);
          });
        });

        req.on('error', (err) => {
          console.error(`   ❌ Request failed: ${err.message}`);
          reject(err);
        });

        req.write(postData);
        req.end();
      });

      console.log(`   📸 Screenshot: ${failure.screenshotPath.split('/').pop()}`);
      
      // Delay between submissions for demo effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Failed to submit: ${error.message}`);
    }
  }

  console.log('\n🎯 Real-time E-commerce Failure Submission Complete!');
  console.log('📊 Results:');
  console.log(`   • ${ecommerceFailures.length} failures submitted to dashboard`);
  console.log(`   • Screenshots now available in failure details`);
  console.log(`   • Refresh dashboard to see new failures with screenshots`);
  
  return ecommerceFailures;
}

// Export for other modules
module.exports = { submitEcommerceFailuresToDashboard };

// Run if called directly
if (require.main === module) {
  submitEcommerceFailuresToDashboard().catch(console.error);
}