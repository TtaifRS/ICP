import { fetchCloseLeads } from '../apis/closeCrm.js';
import { scrapeSocialMediaLinks } from '../utils/scrapper.js';
import { launchBrowser } from '../utils/puppeteer.js';


export const postScrapper = async (req, res) => {
  const scrapedLeads = [];
  const browser = await launchBrowser(); // Launch Puppeteer browser once

  try {
    // Fetch leads from the Close CRM API
    const { leads, success } = await fetchCloseLeads();

    // Ensure the operation proceeds only if `success` is true
    if (!success) {
      return res.status(500).json({ message: 'Failed to fetch leads from Close CRM.' });
    }

    // Extract the URL and name for each lead
    const leadDetails = leads.map((lead) => ({
      url: lead.url,
      name: lead.name,
    }));

    // For testing, process only the first five leads
    const testLeads = leadDetails.slice(0, 5);

    // Process each lead sequentially
    for (const lead of testLeads) {
      const page = await browser.newPage(); // Open a new page for each URL
      const socialLinks = await scrapeSocialMediaLinks(lead.url, page); // Pass the page instance to scrape function
      await page.close(); // Close the page after scraping

      scrapedLeads.push({
        name: lead.name,
        url: lead.url,
        socialMediaLinks: socialLinks,
      });
    }

    // Respond with the scraped leads
    res.status(200).json(scrapedLeads);
  } catch (err) {
    console.error('Error in postScrapper:', err);
    res.status(500).json({ message: err.message });
  } finally {
    await browser.close(); // Ensure the browser is closed in case of any error
  }
};
