import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';

// Add the stealth plugin to Puppeteer
puppeteer.use(StealthPlugin());

/**
 * Launches a Puppeteer browser instance with customized settings to mimic human interaction.
 * @returns {Promise<puppeteer.Browser>} Puppeteer browser instance.
 */
export const launchBrowser = async () => {
  const desktopUserAgent = new UserAgent({ deviceCategory: 'desktop' }).random().toString();


  const browser = await puppeteer.launch({

    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),

    headless: true,
    args: [
      `--user-agent=${desktopUserAgent}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--lang=en-US,en',
      "--single-process",
      "--no-zygote",
    ],
  });

  // Create a new page instance
  const page = await browser.newPage();
  await blockUnnecessaryResources(page)

  // Set a random user agent
  await page.setUserAgent(desktopUserAgent);

  // Mimic human interaction by overriding navigator properties
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32', // Spoof platform as Windows
    });
    Object.defineProperty(navigator, 'vendor', {
      get: () => 'Google Inc.',
    });
    Object.defineProperty(navigator, 'language', {
      get: () => 'en-US', // Force language to English
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'], // Spoof supported languages
    });
  });

  await page.setGeolocation({ latitude: 52.5200, longitude: 13.4050 }); // Set German location

  return browser;
};

/**
 * Blocks unnecessary resources like images, stylesheets, etc., to speed up navigation.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 */
export const blockUnnecessaryResources = async (page) => {
  // Ensure no duplicate request listeners are present
  page.removeAllListeners('request');

  // Enable request interception
  await page.setRequestInterception(true);

  // Intercept and handle requests
  page.on('request', (request) => {
    try {
      const resourceType = request.resourceType();
      if (['stylesheet', 'image', 'font', 'media'].includes(resourceType)) {
        request.abort(); // Block unnecessary resources
      } else {
        request.continue(); // Allow other requests
      }
    } catch (err) {
      console.error(`Error intercepting request: ${err.message}`);
      if (!request.isInterceptResolutionHandled()) {
        request.continue(); // Ensure all requests are resolved
      }
    }
  });
};

/**
 * Handles navigation with retries in case of errors.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} url - URL to navigate to.
 * @param {number} timeout number in ms
 * @param {number} retries - Number of retry attempts.
 */
// export const safeGoto = async (page, url, waitUntil = 'networkidle2', timeout = 60000, retries = 3, waitFor = false) => {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       // Navigate to the URL
//       await page.goto(url, { waitUntil, timeout });

//       if (waitFor) {
//         await page.waitForFunction(
//           () => {
//             const socialMediaSelectors = ['a[href*="facebook.com"]', 'a[href*="twitter.com"]', 'a[href*="instagram.com"]', 'a[href*="youtube.com"], a[href*="linkedin.com"]'];
//             const imprintSelectors = ['a[href*="imprint"]', 'a[href*="impressum"]'];

//             return (
//               socialMediaSelectors.some(selector => document.querySelector(selector)) ||
//               imprintSelectors.some(selector => document.querySelector(selector))
//             );
//           },
//           { timeout: 15000 } // Wait up to 15 seconds
//         ).catch(() => {
//           console.warn("Specific elements not found in time, proceeding with partial data.");
//         });
//       }

//       return; // Exit function if navigation is successful
//     } catch (error) {
//       // Log detailed error message
//       console.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);

//       // Handle specific errors
//       if (error.message.includes('Execution context was destroyed')) {
//         console.warn(`Execution context error on ${url} (attempt ${attempt}). Retrying...`);
//       } else if (error.message.includes('Navigation timeout')) {
//         console.warn(`Navigation timeout for ${url} (attempt ${attempt}). Retrying...`);
//       } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
//         console.warn(`Connection refused to ${url} (attempt ${attempt}). Retrying...`);
//       } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
//         console.warn(`DNS resolution failed for ${url} (attempt ${attempt}). Retrying...`);
//       } else if (error.message.includes('Target closed')) {
//         console.warn(`Page or browser unexpectedly closed for ${url} (attempt ${attempt}). Retrying...`);
//       } else {
//         console.error(`Unexpected error on ${url} (attempt ${attempt}): ${error.message}`);
//       }

//       // If max retries reached, rethrow the error
//       if (attempt === retries) {
//         throw new Error(`Failed to navigate to ${url} after ${retries} attempts.`);
//       }

//       // Wait before retrying
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       // Reload the page to reset context
//       try {
//         await page.reload({ waitUntil: 'domcontentloaded' });
//       } catch (reloadError) {
//         console.warn(`Failed to reload the page on ${url}: ${reloadError.message}`);
//       }
//     }
//   }
// };
export const safeGoto = async (page, url, timeout = 60000, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Navigate to the URL
      await page.goto(url, { waitUntil: 'networkidle2', timeout });
      return; // Exit function if navigation is successful
    } catch (error) {
      // Check if the error is related to the execution context being destroyed
      if (error.message.includes('Execution context was destroyed')) {
        console.warn(`Execution context error on ${url} (attempt ${attempt}). Retrying...`);
      } else {
        console.error(`Error navigating to ${url} (attempt ${attempt}): ${error.message}`);
      }

      // If max retries reached, rethrow the error
      if (attempt === retries) {
        throw new Error(`Failed to navigate to ${url} after ${retries} attempts.`);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reload the page to reset context
      try {
        await page.reload({ waitUntil: 'domcontentloaded' });
      } catch (reloadError) {
        console.warn(`Failed to reload the page: ${reloadError.message}`);
      }
    }
  }
};

/**
 * Mimics human-like scrolling behavior on the page.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {number} distance - Total scrolling distance.
 * @param {number} minStep - Minimum scrolling step size.
 * @param {number} maxStep - Maximum scrolling step size.
 * @param {number} minDelay - Minimum delay (ms) between scrolls.
 * @param {number} maxDelay - Maximum delay (ms) between scrolls.
 */
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
 * Simulates human-like mouse movement on the page.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {Array<{x: number, y: number}>} path - Array of coordinates for mouse movement.
 * @param {number} minDelay - Minimum delay (ms) between movements.
 * @param {number} maxDelay - Maximum delay (ms) between movements.
 */
export const mimicMouseMovement = async (page, path, minDelay = 50, maxDelay = 150) => {
  for (const point of path) {
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    await page.mouse.move(point.x, point.y);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};


export const waitForDynamicContent = async (page, timeout = 30000) => {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('*').length > 0,
      { timeout }
    );
    console.log(document.querySelectorAll('*').length > 0)
  } catch {
    throw new Error('Dynamic content did not load within the timeout.');
  }
};
