import * as cheerio from 'cheerio';

import { blockUnnecessaryResources, mimicScroll, safeGoto } from './puppeteer.js';

import {
  calculateTextToHtmlRatio,
  checkBrokenLinks,
  checkCanonicalTag,
  checkCommonLibraryFiles,
  checkFavicon,
  checkHeaderTags,
  checkHreflangTags,
  checkHttpHeaders,
  checkWebStack,
  checkImageAltText,
  checkMetaDescription,
  checkMissingOrEmptyLinks,
  checkOpenGraphTags,
  checkRobotsMetaTag,
  checkSchemaMarkup,
  checkViewportMetaTag,
  checkTitleTag
} from '../helpers/seoChecker.js';
import { extractEmailsFromAnchors, extractFromFullHtml, extractJobTitlesAndNames, extractPhonesFromAnchors } from '../helpers/contactInfo.js';

/**
 * Extracts social media links from the page HTML.
 * @param {string} html - The HTML content of the webpage.
 * @returns {Object} An object containing social media links.
 */
const extractSocialMediaLinks = (html) => {
  const $ = cheerio.load(html);

  const socialMediaPatterns = {
    twitter: /twitter\.com\/[A-Za-z0-9_]+/i,
    facebook: /facebook\.com\/[A-Za-z0-9_.]+/i,
    instagram: /instagram\.com\/[A-Za-z0-9_.]+/i,
    linkedin: /linkedin\.com\/in\/[A-Za-z0-9-]+|linkedin\.com\/company\/[A-Za-z0-9-]+/i,
    youtube: /youtube\.com\/(channel|c|user)\/[A-Za-z0-9_-]+/i,
    pinterest: /pinterest\.com\/[A-Za-z0-9_-]+/i,
    xing: /xing\.com/i,
  };

  const socialMediaLinks = {};

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');

    for (const [platform, pattern] of Object.entries(socialMediaPatterns)) {
      if (pattern.test(href) && !socialMediaLinks[platform]) {
        socialMediaLinks[platform] = href;
      }
    }
  });

  return socialMediaLinks;
};

/**
 * Finds and extracts the Imprint/Impressum page link.
 * @param {string} html - The HTML content of the webpage.
 * @param {string} baseUrl - The base URL of the website.
 * @returns {string|null} The resolved URL of the Imprint/Impressum page, or null if not found.
 */
const findImprintLink = (html, baseUrl) => {
  const $ = cheerio.load(html);

  const imprintLink = $('a[href]')
    .filter((_, element) => {
      const linkText = $(element).text().toLowerCase();
      return linkText.includes('imprint') || linkText.includes('impressum');
    })
    .attr('href');

  if (!imprintLink) {
    return null;
  }

  // Check if the href is an absolute URL
  const isAbsoluteUrl = /^(https?:)?\/\//i.test(imprintLink);

  // If it's a relative URL, combine it with the base URL
  return isAbsoluteUrl ? imprintLink : new URL(imprintLink, baseUrl).toString();
};





/**
 * Extracts emails, phone numbers, and names with job titles from Imprint/Impressum page HTML.  
 * @param {string} html - HTML content of the page.  
 * @returns {Object} Emails, phones, and job titles with names.  
 */

export const extractContactInfo = (html) => {
  const $ = cheerio.load(html);

  const emailPattern = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const phonePattern = /tel:([\d\s()+-]+)/i;
  const jobTitles = [
    'CEO', 'Geschäftsführer', 'Geschäftsführung', 'Director', 'Founder', 'Co-Founder',
    'Owner', 'Partner', 'Vorstand', 'Vorsitzender', 'Direktor',
    'CFO', 'COO', 'CTO', 'CMO', 'Präsident', 'Vizepräsident',
    'Manager', 'Betriebsleiter', 'Abteilungsleiter', 'Chairman', 'Chairwoman', 'Chairperson',
    'Management', 'Director', 'Board', 'Principal', 'Leader', 'Aufsichtsrates'
  ];

  // Extract emails and phones from anchor tags
  const emails = extractEmailsFromAnchors($, emailPattern);
  const phones = extractPhonesFromAnchors($, phonePattern);

  // Extract job titles and names
  const textContent = $.text();
  const jobTitlesWithNames = extractJobTitlesAndNames(textContent, jobTitles);

  // Fallback: Extract from the full HTML
  const { emails: fallbackEmails, phones: fallbackPhones } = extractFromFullHtml($.html());

  // Combine and deduplicate emails and phones
  fallbackEmails.forEach((email) => emails.add(email));
  fallbackPhones.forEach((phone) => phones.add(phone));

  return {
    emails: Array.from(emails),
    phones: Array.from(phones),
    jobTitlesWithNames,
  };
};


/**
 * Function to check SEO-related tags on a webpage.
 * @param {string} html - The HTML content of the webpage to scrape.
 * @returns {Object} An object containing the status and details of various SEO tags, including title, meta description, header tags, image alt text, schema markup, robots meta tag, hreflang tags, Open Graph tags, Twitter card tags, and canonical tag.
 */
export const checkSeoTags = (html) => {
  const $ = cheerio.load(html);

  // Aggregate all the checks
  return {
    titleTag: checkTitleTag($),
    metaDescription: checkMetaDescription($),
    headerTags: checkHeaderTags($),
    imageAltText: checkImageAltText($),
    schemaMarkup: checkSchemaMarkup($),
    robotsMetaTag: checkRobotsMetaTag($),
    hreflangTags: checkHreflangTags($),
    openGraphTags: checkOpenGraphTags($),
    canonicalTag: checkCanonicalTag($),
    favicon: checkFavicon($),
    viewportMetaTag: checkViewportMetaTag($),
    brokenLinks: checkBrokenLinks($),
    textToHtmlRatio: calculateTextToHtmlRatio(html, $),
    missingOrEmptyLinks: checkMissingOrEmptyLinks($),
    commonLibraryFiles: checkCommonLibraryFiles($),
    // httpHeaders: checkHttpHeaders($),
    webStack: checkWebStack($),
  };
};






/**
 * Main function to scrape social media links and Imprint/Impressum details.
 * @param {string} url - The webpage URL to scrape.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @returns {Promise<Object>} An object containing social media links and Imprint/Impressum details.
 */
export const scrapeWebsiteDetails = async (url, page) => {
  try {
    // Navigate to the main URL
    await safeGoto(page, url, 0);

    // Get the final navigated URL after redirection
    let finalUrl = page.url();

    // Check if the final URL includes '/en' and replace it with '/de' if present
    if (finalUrl.includes('/en')) {
      finalUrl = finalUrl.replace('/en', '/de');
      console.log(`Redirecting to German version: ${finalUrl}`);
      await safeGoto(page, finalUrl, 0);
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    // Check the number of divs in the body tag
    const divCount = await page.evaluate(() => document.body.querySelectorAll('div').length);


    if (!divCount || divCount < 20) {
      console.log(`Low number of divs (${divCount}) detected, waiting 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      // Wait for the page to reload if necessary
      await page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded', 'networkidle0'] });

      // Wait for the page content to be stable
      await page.waitForSelector('body', { timeout: 30000 });
    }

    // await blockUnnecessaryResources(page);
    await mimicScroll(page, 2000);

    // Extract the page content
    const html = await page.content();

    // Extract social media links
    const socialMediaLinks = extractSocialMediaLinks(html);

    // Extract Seo Info 
    const seoInfo = checkSeoTags(html)

    // Find the Imprint/Impressum page link
    const imprintLink = findImprintLink(html, url);

    let imprintDetails = null;

    if (imprintLink) {
      // Navigate to the Imprint/Impressum page
      await safeGoto(page, imprintLink);

      // await blockUnnecessaryResources(page);
      await mimicScroll(page, 2000);

      // Extract only the text content from the page
      const imprintText = await page.evaluate(() => document.body.innerText);

      // Extract contact information using the text
      imprintDetails = extractContactInfo(imprintText);
    }

    return { socialMediaLinks, imprintDetails, seoInfo };
  } catch (error) {
    console.error(`Error while scraping ${url}:`, error);
    return { socialMediaLinks: {}, imprintDetails: null, seoInfo: null };
  }
};
