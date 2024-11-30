import { mimicScroll, safeGoto } from '../utils/puppeteer.js';

// Helper function to perform a search and extract results
export const performSearch = async (page, searchTerm) => {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
  try {
    await safeGoto(page, searchUrl);
    await page.waitForSelector('#search', { timeout: 15000 });
    await mimicScroll(page, 2000);

    // Extract <cite> text from search results
    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('cite'))
        .map((cite) => {
          const match = cite.innerText.trim().match(/https?:\/\/[^\s>]+/);
          return match ? match[0] : null; // Extract only valid URLs or null if no match
        })
        .filter(Boolean); // Remove null values
    });

    return results;
  } catch (err) {
    console.error(`Error performing Google search for ${searchTerm}: ${err.message}`);
    return [];
  }
};