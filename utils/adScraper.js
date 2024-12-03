import * as cheerio from 'cheerio'
import { safeGoto, mimicScroll } from './puppeteer.js';
import { scrapeFacebookPageID, scrapeMetaAdLibrary } from '../helpers/facebookAd.js';

export const scrapeGoogleAdTransparency = async (page, leadUrl) => {
  let result = null;

  try {
    // Extract domain and remove "www." prefix if present
    const domain = new URL(leadUrl).hostname.replace(/^www\./, '');
    const transparencyUrl = `https://adstransparency.google.com/?region=DE&hl=en&domain=${domain}`;
    await page.setCookie({
      name: 'lang',
      value: 'en',
      domain: '.google.com',
      path: '/',
      httpOnly: true,
      secure: true,
    });
    await safeGoto(page, transparencyUrl);
    await mimicScroll(page);

    const transparencyPageHtml = await page.content();
    const $ = cheerio.load(transparencyPageHtml);

    const firstCreativeHref = $('creative-preview a').first().attr('href');
    const advertiserName = $('div.advertiser-name').first().text().trim();

    if (!firstCreativeHref) {
      console.warn(`No creative preview found for domain: ${domain}`);
      return null;
    }

    const creativeUrl = `https://adstransparency.google.com${firstCreativeHref}`;

    await safeGoto(page, creativeUrl);
    // await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));

    const creativePageHtml = await page.content();
    const $$ = cheerio.load(creativePageHtml);

    const firstShown = $$('div.property.first-shown').text().replace('First shown:', '').trim();
    const lastShown = $$('div.property.last-shown').text().replace('Last shown:', '').trim();
    const topic = $$('div.property.subject-matter ').text().replace('Topic:', '').trim();


    result = {
      domain,
      advertiserName,
      firstShown,
      lastShown,
      topic,
    };
  } catch (error) {
    console.error('Error scraping Google Ad Transparency:', error.message);
  }

  return result;
};


/**
 * Combines scrapeFacebookPageID and scrapeMetaAdLibrary into one function.
 * @param {object} page - Puppeteer page instance.
 * @param {string} facebookUrl - URL of the Facebook page.
 * @returns {object} - Data from Meta Ad Library or error information.
 */
export const scrapeFacebookAndMetaAdLibrary = async (page, facebookUrl) => {
  try {
    // Step 1: Scrape Facebook Page ID
    const pageId = await scrapeFacebookPageID(page, facebookUrl);

    if (!pageId) {
      console.warn(`No Page ID found for ${facebookUrl}. Skipping Meta Ad Library scraping.`);
      return {
        facebookUrl,
        pageId: null,
        adLibraryData: null,
        message: 'Page ID not found, skipping Meta Ad Library scraping.',
      };
    }

    // Step 2: Scrape Meta Ad Library using the Page ID
    const adLibraryData = await scrapeMetaAdLibrary(page, pageId);

    return {
      facebookUrl,
      pageId,
      adLibraryData,
    };
  } catch (error) {
    console.error(`Error combining Facebook Page ID and Meta Ad Library scraping for ${facebookUrl}:`, error);
    return {
      facebookUrl,
      pageId: null,
      adLibraryData: null,
      error: error.message,
    };
  }
};