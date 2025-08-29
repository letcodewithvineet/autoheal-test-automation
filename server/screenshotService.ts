import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';

export class ScreenshotService {
  private static instance: ScreenshotService;
  
  public static getInstance(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService();
    }
    return ScreenshotService.instance;
  }

  async generateFailureScreenshot(failureData: {
    test: string;
    errorMessage: string;
    domHtml: string;
    browser: string;
    viewport: string;
    currentSelector: string;
    selectorContext?: any;
  }): Promise<string> {
    let browser = null;
    
    try {
      // Launch browser with appropriate settings
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH || '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--no-first-run',
          '--no-zygote'
        ]
      });

      const page = await browser.newPage();
      
      // Parse viewport dimensions
      const [width, height] = failureData.viewport.split('x').map(Number);
      await page.setViewport({ width: width || 1366, height: height || 768 });

      // Create HTML content that shows the failure state
      const failureHtml = this.createFailureHtml(failureData);
      
      // Set the content and wait for it to load
      await page.setContent(failureHtml, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });

      // Add error highlighting CSS
      await page.addStyleTag({
        content: `
          .failure-highlight {
            border: 3px solid #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.1) !important;
            position: relative;
          }
          
          .failure-highlight::after {
            content: "Failed Element";
            position: absolute;
            top: -25px;
            left: 0;
            background: #ef4444;
            color: white;
            padding: 2px 8px;
            font-size: 12px;
            border-radius: 3px;
            font-family: Arial, sans-serif;
            z-index: 1000;
          }
          
          .error-overlay {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(239, 68, 68, 0.95);
            color: white;
            padding: 15px;
            border-radius: 8px;
            max-width: 400px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
          }
          
          .error-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .error-message {
            font-size: 13px;
            line-height: 1.4;
          }
          
          .browser-info {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: Arial, sans-serif;
          }
        `
      });

      // Highlight the failed element if we can find it
      if (failureData.currentSelector) {
        try {
          await page.evaluate((selector) => {
            try {
              const element = document.querySelector(selector);
              if (element) {
                element.classList.add('failure-highlight');
              }
            } catch (e) {
              // Selector might be invalid, ignore
            }
          }, failureData.currentSelector);
        } catch (e) {
          // Continue even if highlighting fails
        }
      }

      // Wait a bit for styles to apply
      await page.waitForTimeout(500);

      // Generate screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false, // Capture viewport only
        clip: {
          x: 0,
          y: 0,
          width: width || 1366,
          height: height || 768
        }
      });

      // Save screenshot to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `failure_${failureData.test.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.png`;
      const screenshotPath = `/cypress/screenshots/${filename}`;
      const fullPath = path.join(process.cwd(), 'public', screenshotPath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write screenshot file
      await fs.writeFile(fullPath, screenshot);

      return screenshotPath;

    } catch (error) {
      console.error('Error generating failure screenshot:', error);
      
      // Fallback: generate a simple error screenshot using canvas/HTML
      return this.generateFallbackScreenshot(failureData);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private createFailureHtml(failureData: {
    test: string;
    errorMessage: string;
    domHtml: string;
    browser: string;
    viewport: string;
    currentSelector: string;
    selectorContext?: any;
  }): string {
    const cleanedDomHtml = failureData.domHtml || '<div>No DOM content available</div>';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Failure - ${failureData.test}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
          }
          
          .container {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .test-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          
          /* Add any additional styling to make the DOM content look realistic */
          input[type="text"], input[type="email"], input[type="password"] {
            padding: 8px 12px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
          }
          
          button {
            padding: 10px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          }
          
          button:hover {
            background: #2563eb;
          }
          
          .search-container {
            display: flex;
            gap: 10px;
            align-items: center;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          
          .login-form {
            max-width: 400px;
            margin: 50px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          
          .dashboard-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 20px;
          }
          
          .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <!-- Browser info overlay -->
        <div class="browser-info">
          ${failureData.browser} ${failureData.viewport}
        </div>
        
        <!-- Error message overlay -->
        <div class="error-overlay">
          <div class="error-title">Test Failure</div>
          <div class="error-message">${failureData.errorMessage || 'Element not found'}</div>
        </div>
        
        <!-- Main content -->
        <div class="container">
          <div class="test-content">
            ${cleanedDomHtml}
          </div>
        </div>
        
        <script>
          // Add some dynamic behavior to make it look more realistic
          document.addEventListener('DOMContentLoaded', function() {
            // Simulate loading state
            setTimeout(() => {
              const buttons = document.querySelectorAll('button');
              buttons.forEach(btn => {
                if (btn.textContent.includes('Search') || btn.textContent.includes('Submit')) {
                  btn.style.opacity = '0.6';
                  btn.style.cursor = 'not-allowed';
                }
              });
            }, 100);
          });
        </script>
      </body>
      </html>
    `;
  }

  async generateFallbackScreenshot(failureData: {
    test: string;
    errorMessage: string;
    domHtml: string;
    browser: string;
    viewport: string;
  }): Promise<string> {
    // Create a simple SVG-based screenshot as fallback
    const [width, height] = failureData.viewport.split('x').map(Number);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `fallback_${failureData.test.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.svg`;
    const screenshotPath = `/cypress/screenshots/${filename}`;
    const fullPath = path.join(process.cwd(), 'public', screenshotPath);

    const svgContent = `
      <svg width="${width || 1366}" height="${height || 768}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .bg { fill: #f8fafc; }
            .container { fill: white; stroke: #e2e8f0; stroke-width: 1; }
            .error-box { fill: #fee2e2; stroke: #ef4444; stroke-width: 2; }
            .error-text { font-family: Arial, sans-serif; font-size: 14px; fill: #dc2626; }
            .info-text { font-family: Arial, sans-serif; font-size: 12px; fill: #64748b; }
            .title-text { font-family: Arial, sans-serif; font-size: 16px; fill: #1e293b; font-weight: bold; }
            .browser-info { fill: rgba(0,0,0,0.7); }
            .browser-text { font-family: Arial, sans-serif; font-size: 11px; fill: white; }
          </style>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" class="bg"/>
        
        <!-- Browser info -->
        <rect x="20" y="20" width="120" height="25" rx="4" class="browser-info"/>
        <text x="25" y="37" class="browser-text">${failureData.browser} ${failureData.viewport}</text>
        
        <!-- Main container -->
        <rect x="50" y="80" width="${(width || 1366) - 100}" height="200" rx="8" class="container"/>
        
        <!-- Error overlay -->
        <rect x="${(width || 1366) - 420}" y="30" width="400" height="80" rx="8" class="error-box"/>
        <text x="${(width || 1366) - 410}" y="50" class="title-text">Test Failure</text>
        <foreignObject x="${(width || 1366) - 410}" y="55" width="380" height="50">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial; font-size: 12px; color: #dc2626; word-wrap: break-word;">
            ${failureData.errorMessage || 'Element not found'}
          </div>
        </foreignObject>
        
        <!-- DOM representation -->
        <text x="70" y="120" class="title-text">Failed Test: ${failureData.test}</text>
        <rect x="70" y="140" width="${(width || 1366) - 140}" height="100" rx="4" fill="#f1f5f9" stroke="#cbd5e1"/>
        
        <!-- Highlighted failed element -->
        <rect x="100" y="170" width="150" height="40" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="3"/>
        <text x="105" y="185" class="error-text">Failed Element</text>
        <text x="105" y="200" class="info-text">Selector not found</text>
        
        <!-- Status -->
        <text x="70" y="${(height || 768) - 40}" class="info-text">Screenshot generated: ${new Date().toLocaleString()}</text>
        <text x="70" y="${(height || 768) - 20}" class="info-text">Note: Real-time screenshot unavailable - showing test failure representation</text>
      </svg>
    `;

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write SVG file
    await fs.writeFile(fullPath, svgContent);

    return screenshotPath;
  }

  async cleanup(): Promise<void> {
    // Clean up old screenshots (keep only last 50)
    try {
      const screenshotDir = path.join(process.cwd(), 'public', 'cypress', 'screenshots');
      const files = await fs.readdir(screenshotDir);
      const pngFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.svg')).sort();
      
      if (pngFiles.length > 50) {
        const filesToDelete = pngFiles.slice(0, pngFiles.length - 50);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(screenshotDir, file));
        }
      }
    } catch (error) {
      // Directory might not exist yet, ignore
    }
  }
}