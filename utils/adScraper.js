import * as cheerio from 'cheerio'
import { safeGoto, mimicScroll } from './puppeteer.js';

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
