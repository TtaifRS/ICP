import * as cheerio from "cheerio";
import { safeGoto } from './puppeteer.js';
import { randomWait } from '../helpers/authWallHelper.js';

/**
 * Scrape data from Google Maps for a given company name and location.
 * @param {object} page - Puppeteer page instance.
 * @param {string} companyName - Name of the company to search for.
 * @param {string} companyLocation - Location of the company to refine the search.
 * @returns {Promise<object>} - Returns an object containing the website URL.
 */
export async function scrapeGoogleMap(page, companyName, companyLocation) {
  try {

    await page.setCookie({
      name: 'lang',
      value: 'en',
      domain: '.google.com',
      path: '/',
      httpOnly: true,
      secure: true,
    });
    const query = `${companyName} ${companyLocation}`;
    const encodedUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en`
    await safeGoto(page, encodedUrl)


    await page.waitForSelector("body"); // Ensure the page is fully loaded
    // Get the page content
    const content = await page.content();

    // Load the content into Cheerio for parsing
    const $ = cheerio.load(content);

    // Check if a Google Maps Place link is present
    const placeLinkElement = $('a[href*="https://www.google.com/maps/place"]').first();
    const href = placeLinkElement.attr("href");

    if (href) {
      // Navigate to the first Google Maps Place link
      await safeGoto(page, href);

      await page.waitForSelector("body");

    }

    // Get the updated page content
    const updatedContent = await page.content();
    const $updated = cheerio.load(updatedContent);

    // Extract website URL from anchor tags with data-tooltip="Open website"
    const websiteLinkElement = $updated('a[data-tooltip="Open website"]');
    const websiteUrl = websiteLinkElement.attr("href") || "";

    return {
      query,
      websiteUrl,
    };
  } catch (error) {
    console.error(`Error scraping Google Maps for query: ${companyName} ${companyLocation}`, error);
    return {
      query: `${companyName} ${companyLocation}`,
      websiteUrl: null,
    };
  }
}