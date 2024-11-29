// Import required modules
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';

// Add the stealth plugin to puppeteer-extra
puppeteer.use(StealthPlugin());

/**
 * Launches a Puppeteer browser instance with customized settings to mimic human interaction.
 * @returns {Promise<puppeteer.Browser>} Puppeteer browser instance.
 */
export const launchBrowser = async () => {
  const userAgent = new UserAgent();

  const browser = await puppeteer.launch({
    headless: false, // Set to true if you don't need a visible browser
    args: [
      `--user-agent=${userAgent.random().toString()}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  // Set a random user agent
  await page.setUserAgent(userAgent.random().toString());

  // Mimic human interaction
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32', // Spoof platform as Windows
    });
    Object.defineProperty(navigator, 'vendor', {
      get: () => 'Google Inc.',
    });
  });

  // Block certain resource types like CSS, images, and fonts
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['stylesheet', 'image', 'font'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Block JavaScript fingerprinting
  await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ? Promise.resolve({ state: 'denied' }) : originalQuery(parameters)
    );

    // Spoof WebGL renderer
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) return 'Intel Inc.'; // Spoof vendor
      if (parameter === 37446) return 'Intel Iris OpenGL Engine'; // Spoof renderer
      return getParameter(parameter);
    };
  });

  return browser;
};

export const mimicScroll = async (page, distance = 1000, minStep = 30, maxStep = 70, minDelay = 50, maxDelay = 150) => {
  let scrolled = 0;
  while (scrolled < distance) {
    const step = Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    await page.evaluate((scrollStep) => {
      window.scrollBy(0, scrollStep);
    }, step);

    scrolled += step;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

/**
 * Simulates mouse movement across the page with random variations.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {Array<{x: number, y: number}>} path - An array of coordinates for the mouse to move along.
 * @param {number} minDelay - Minimum delay (ms) between each movement step.
 * @param {number} maxDelay - Maximum delay (ms) between each movement step.
 */
export const mimicMouseMovement = async (page, path, minDelay = 50, maxDelay = 150) => {
  for (const point of path) {
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    await page.mouse.move(point.x, point.y);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};