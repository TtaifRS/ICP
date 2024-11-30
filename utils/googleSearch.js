import { performSearch } from '../helpers/searchGoogle.js';


/**
 * Searches Google for the given company name and checks if the website URL appears in the top results.
 * @param {puppeteer.Page} page - Puppeteer page instance.
 * @param {string} companyName - The company name to search for.
 * @param {string} websiteUrl - The website URL to check.
 * @returns {Promise<{rank: number | null, results: string[]}>} The rank of the website (1-10) or null if not found, and the list of URLs.
 */
export const searchWebsiteOnGoogle = async (page, companyName, websiteUrl) => {
  // Perform the actual company search
  const results = await performSearch(page, companyName);

  // Normalize the website URL (handle http:// vs https:// and www)
  const normalizeUrl = (url) => {
    const normalized = new URL(url);
    normalized.protocol = 'https:'; // Ensure https:// comparison
    normalized.hostname = normalized.hostname.replace(/^www\./, ''); // Remove 'www.' if present
    return normalized.href;
  };

  const normalizedWebsiteUrl = normalizeUrl(websiteUrl);

  // Filter URLs that match the given website URL
  const matchingUrls = results.filter((url) => normalizeUrl(url).startsWith(normalizedWebsiteUrl));

  // Find the rank of the first matching website
  const rank = matchingUrls.length > 0 ? results.findIndex((url) => normalizeUrl(url).startsWith(normalizedWebsiteUrl)) + 1 : null;

  return { rank: rank || null, matchingUrls };
};
