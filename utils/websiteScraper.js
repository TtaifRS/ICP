import * as cheerio from 'cheerio';
import validator from 'validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { mimicScroll, safeGoto } from './puppeteer.js';
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
} from './seoChecker.js';

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
    xing: /xing\.com\/profile\/[A-Za-z0-9-]+/i,
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

  return imprintLink ? new URL(imprintLink, baseUrl).toString() : null;
};



/**
 * Extracts all telephone numbers and emails from the Imprint/Impressum page.
 * @param {string} html - The HTML content of the Imprint/Impressum page.
 * @returns {Object} An object containing arrays of emails and phones, if found.
 */
export const extractContactInfo = (html) => {
  const $ = cheerio.load(html);

  // Patterns for email and phone
  const emailPattern = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const phonePattern = /tel:([\d\s()+-]+)/i; // Matches general phone formats

  const emails = new Set();
  const phones = new Set();

  // Extract emails and phones from <a> tags with href attributes
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');

    // Extract emails
    if (emailPattern.test(href)) {
      const extractedEmail = href.match(emailPattern)?.[1];
      if (validator.isEmail(extractedEmail)) {
        emails.add(extractedEmail);
      }
    }

    // Extract phones
    if (phonePattern.test(href)) {
      const extractedPhone = href.match(phonePattern)?.[1];
      if (typeof extractedPhone === 'string') {
        const parsedPhone = parsePhoneNumberFromString(extractedPhone);
        if (parsedPhone && parsedPhone.isValid()) {
          phones.add(parsedPhone.number);
        }
      }
    }
  });

  // Fallback to the full HTML content if not all emails or phones are found
  const fullHtml = $.html();

  // Extract emails from full HTML
  const emailMatches = fullHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emailMatches) {
    emailMatches.forEach((email) => {
      if (validator.isEmail(email)) {
        emails.add(email);
      }
    });
  }

  // Extract phones from full HTML
  const phoneMatches = fullHtml.match(/[\d\s()+-]+/g);
  if (phoneMatches) {
    phoneMatches.forEach((phone) => {
      if (typeof phone === 'string') {
        const parsedPhone = parsePhoneNumberFromString(phone);
        if (parsedPhone && parsedPhone.isValid()) {
          phones.add(parsedPhone.number);
        }
      }
    });
  }

  // Convert Sets to Arrays for output
  return {
    emails: Array.from(emails),
    phones: Array.from(phones),
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
    httpHeaders: checkHttpHeaders($),
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
    await safeGoto(page, url);
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

      // Extract contact information from the Imprint/Impressum page
      const imprintHtml = await page.content();
      imprintDetails = extractContactInfo(imprintHtml);
    }

    return { socialMediaLinks, imprintDetails, seoInfo };
  } catch (error) {
    console.error(`Error while scraping ${url}:`, error);
    return { socialMediaLinks: {}, imprintDetails: null, seoInfo: null };
  }
};