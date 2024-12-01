import { safeGoto } from './puppeteer.js'; // Assuming safeGoto handles retries and navigation
import * as cheerio from 'cheerio'
import nlp from 'compromise';
/**
 * Scrape the number of followers from a Facebook page.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} facebookUrl - The Facebook page URL.
 * @returns {Promise<number|null>} The number of followers or null if not found.
 */
export const scrapeFacebookFollowers = async (page, facebookUrl) => {
  try {
    // Construct the followers URL
    const followersUrl = `${facebookUrl}/followers`;

    // Navigate to the followers page
    await safeGoto(page, followersUrl);

    // Wait for the page to load necessary content
    await page.waitForSelector('a[href*="/followers"]', { timeout: 5000 });

    // Extract the followers text
    const followersText = await page.$eval('a[href*="/followers"]', (aTag) => aTag.textContent.trim());

    // Regex to capture numbers with potential K, M, or B suffixes
    const followersMatch = followersText.match(/([\d,.]+)\s*[KMB]?/i);

    if (!followersMatch) return null;

    // Parse the followers count
    let followersCount = parseFloat(followersMatch[1].replace(/,/g, '')); // Remove commas and convert to float
    const suffix = followersText.match(/[KMB]/i)?.[0]?.toUpperCase();

    // Adjust the count based on suffix
    if (suffix === 'K') followersCount *= 1_000;
    else if (suffix === 'M') followersCount *= 1_000_000;
    else if (suffix === 'B') followersCount *= 1_000_000_000;

    return Math.round(followersCount); // Return as an integer
  } catch (error) {
    console.error(`Error scraping followers from ${facebookUrl}:`, error);
    return null;
  }
};


/**
 * Scrape Instagram followers by searching on Google.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} instagramUrl - The Instagram profile URL.
 * @returns {Promise<string|null>} The number of followers or null if not found.
 */

export const scrapeInstagramFollowers = async (page, instagramUrl) => {
  try {


    const handleMatch = instagramUrl.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
    const instagramHandle = handleMatch ? handleMatch[1] : null;



    if (!instagramHandle) {
      throw new Error(`Invalid Instagram URL: ${instagramUrl}`);
    }

    const searchQuery = `${instagramHandle} instagram`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;


    await safeGoto(page, googleSearchUrl);

    const pageHTML = await page.content();
    const $ = cheerio.load(pageHTML);



    // Extract all text from the page
    const fullText = $('body').text();


    // Use NLP to analyze the full text
    const doc = nlp(fullText);

    // Match text with a pattern like "961 Followers, 57 Following, 497 Posts"
    const regex = /([\d,]+)\s+Followers,?\s+([\d,]+)\s+Following,?\s+([\d,]+)\s+Posts/i;

    // Search through sentences
    let followersCount = null;
    let followingCount = null;
    let postsCount = null;

    doc.sentences().data().forEach(({ text }) => {
      const match = text.match(regex);
      if (match) {
        followersCount = parseInt(match[1].replace(/,/g, ''), 10);
        followingCount = parseInt(match[2].replace(/,/g, ''), 10);
        postsCount = parseInt(match[3].replace(/,/g, ''), 10);


        // Stop further iteration once data is found
        return false;
      }
    });



    return { followersCount, followingCount, postsCount };
  } catch (error) {
    console.error(`Error scraping Instagram followers for ${instagramUrl}:`, error);
    return null;
  }
};

/**
 * Scrape industry information from a LinkedIn page.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} linkedinUrl - The LinkedIn profile or company page URL.
 * @returns {Promise<string|null>} The industry text or null if not found.
 */
export const scrapeLinkedInData = async (page, linkedinUrl) => {
  try {
    await safeGoto(page, linkedinUrl);

    // Check for auth wall redirection
    if (await page.$('div.authwall')) {
      console.error('Auth wall detected. Aborting scrape.');
      return null;
    }

    // Wait for the main content to load
    await page.waitForSelector('main.main', { timeout: 5000 });

    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract general data
    const industry = $('div[data-test-id="about-us__industry"] dd').text().trim() || null;
    const size = $('div[data-test-id="about-us__size"] dd').text().trim() || null;
    const headquarters = $('div[data-test-id="about-us__headquarters"] dd').text().trim() || null;
    const organizationType = $('div[data-test-id="about-us__organizationType"] dd').text().trim() || null;
    const foundedOn = $('div[data-test-id="about-us__foundedOn"] dd').text().trim() || null;
    const specialties = $('div[data-test-id="about-us__specialties"] dd').text().trim() || null;

    // Extract employees data
    const employees = [];
    $('section[data-test-id="employees-at"] li').each((index, element) => {
      const name = $(element).find('h3').text().trim() || null;
      const position = $(element).find('h4').text().trim() || null;

      if (name && position) {
        employees.push({ name, position });
      }
    });

    return {
      industry,
      size,
      headquarters,
      organizationType,
      foundedOn,
      specialties,
      employees,
    };
  } catch (error) {
    console.error(`Error scraping LinkedIn data from ${linkedinUrl}`, error);
    return null;
  }
};
