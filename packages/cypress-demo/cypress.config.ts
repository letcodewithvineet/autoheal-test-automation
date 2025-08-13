import { defineConfig } from 'cypress';
import './cypress/support/autoheal';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.spec.{js,jsx,ts,tsx}',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshot: true,
    env: {
      CYPRESS_AUTOHEAL_API_URL: process.env.CYPRESS_AUTOHEAL_API_URL || 'http://localhost:4000',
      autoheal: true
    }
  },
});
