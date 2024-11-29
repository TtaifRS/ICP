import * as cheerio from 'cheerio';
import { blockUnnecessaryResources, mimicScroll, safeGoto } from './puppeteer.js';

/**
 * Extracts social media links from a given URL.
 * @param {string} url - The webpage URL to scrape.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @returns {Promise<Object>} An object containing social media links.
 */
export const scrapeSocialMediaLinks = async (url, page) => {
  try {
    // Navigate to the provided URL
    await safeGoto(page, url)
    await blockUnnecessaryResources(page);

    // Mimic human scrolling to load dynamic content
    await mimicScroll(page, 2000);

    // Extract the page content as HTML
    const html = await page.content();

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Define patterns for social media platforms
    const socialMediaPatterns = {
      twitter: /twitter\.com\/[A-Za-z0-9_]+/i,
      facebook: /facebook\.com\/[A-Za-z0-9_.]+/i,
      instagram: /instagram\.com\/[A-Za-z0-9_.]+/i,
      linkedin: /linkedin\.com\/in\/[A-Za-z0-9-]+|linkedin\.com\/company\/[A-Za-z0-9-]+/i,
      youtube: /youtube\.com\/(channel|c|user)\/[A-Za-z0-9_-]+/i,
      pinterest: /pinterest\.com\/[A-Za-z0-9_-]+/i,
      xing: /xing\.com\/profile\/[A-Za-z0-9-]+/i,
    };

    const socialMediaLinks = {};

    // Extract all anchor tags and find matches for social media platforms
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');

      for (const [platform, pattern] of Object.entries(socialMediaPatterns)) {
        if (pattern.test(href) && !socialMediaLinks[platform]) {
          socialMediaLinks[platform] = href;
        }
      }
    });

    return socialMediaLinks;
  } catch (error) {
    console.error(`Error while scraping ${url}:`, error);
    return {};
  }
};
