import { searchWebsiteOnGoogle } from '../utils/googleSearch.js';


export const handleAuthWall = async (browser, page) => {
  try {
    console.log('Handling LinkedIn auth wall. Simulating user activity with searches...');

    // Perform dummy searches to simulate activity
    const dummySearches = [
      { query: 'Wikipedia', url: 'https://www.wikipedia.org' },
      { query: 'GitHub', url: 'https://github.com' },
      { query: 'Medium', url: 'https://www.medium.com' },
      { query: 'Stack Overflow', url: 'https://www.stackoverflow.com' },
    ];

    for (const { query, url } of dummySearches) {
      await searchWebsiteOnGoogle(page, query, url);
      console.log(`Performed dummy search for "${query}".`);
    }

    // Wait for 1-2 minutes
    const waitTime = Math.floor(Math.random() * 60 + 60) * 1000; // Random wait time between 1-2 minutes
    console.log(`Waiting for ${waitTime / 1000} seconds before retrying LinkedIn.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    console.log('Retrying LinkedIn scraping after handling auth wall.');
  } catch (err) {
    console.error('Error while handling LinkedIn auth wall:', err);
    throw err;
  }
};
