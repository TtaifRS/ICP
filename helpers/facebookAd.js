import { safeGoto } from '../utils/puppeteer.js';

export const scrapeFacebookPageID = async (page, facebookUrl) => {
  try {
    // Construct the URL for profile transparency
    const transparencyUrl = `${facebookUrl}/about_profile_transparency`;

    // Navigate to the profile transparency page
    await safeGoto(page, transparencyUrl);

    // Wait for the page to load necessary content
    await page.waitForSelector('body', { timeout: 5000 });

    // Extract the text that matches the page ID pattern
    const pageIdText = await page.evaluate(() => {
      // Find all text content on the page
      const bodyText = document.body.textContent;

      // Regex to match a string of digits (at least 9 digits)
      const match = bodyText.match(/\b\d{9,12}\b/);

      // Return the matched string or null if not found
      return match ? match[0] : null;
    });

    if (!pageIdText) {
      console.warn(`No Page ID found on ${transparencyUrl}`);
      return null;
    }

    return pageIdText; // Return the extracted page ID
  } catch (error) {
    console.error(`Error scraping Page ID from ${facebookUrl}:`, error);
    return null;
  }
};

export const scrapeMetaAdLibrary = async (page, pageId) => {
  try {
    // Construct the Meta Ad Library URL with the provided page ID
    const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=DE&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=${pageId}`;

    // Navigate to the constructed URL
    await safeGoto(page, adLibraryUrl);

    // Wait for the page to load necessary content
    await page.waitForSelector('body', { timeout: 5000 });

    // Extract the ad status and the "Started running on" span text
    const adLibraryData = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const adStatus = bodyText.includes('No ads') ? 'No active ads found' : 'Active ads found';

      // Find the first <span> element that starts with "Started running on"
      const spans = Array.from(document.querySelectorAll('span'));
      const startedRunningSpan = spans.find((span) =>
        span.textContent.startsWith('Started running on')
      );

      return {
        adStatus,
        startedRunningText: startedRunningSpan ? startedRunningSpan.textContent.trim() : null,
      };
    });

    return {
      pageId,
      adLibraryUrl,
      adStatus: adLibraryData.adStatus,
      startedRunningText: adLibraryData.startedRunningText,
    };
  } catch (error) {
    console.error(`Error scraping Meta Ad Library for Page ID ${pageId}:`, error);
    return {
      pageId,
      adLibraryUrl: null,
      adStatus: null,
      startedRunningText: null,
      error: error.message,
    };
  }
};