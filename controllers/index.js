import { fetchCloseLeads } from '../apis/closeCrm.js';
import { scrapeWebsiteDetails } from '../utils/websiteScraper.js'; // Updated function
import { launchBrowser } from '../utils/puppeteer.js';
import { fetchPageSpeedData } from '../utils/pageSpeedApi.js';

export const postScrapper = async (req, res) => {
  const scrapedLeads = [];
  const browser = await launchBrowser();

  try {
    const { leads, success } = await fetchCloseLeads();

    if (!success) {
      return res.status(500).json({ message: 'Failed to fetch leads from Close CRM.' });
    }

    const leadDetails = leads.map((lead) => ({
      url: lead.url,
      name: lead.name,
    }));

    const testLeads = leadDetails.slice(0, 5);

    for (const lead of testLeads) {
      const page = await browser.newPage();
      const websiteDetails = await scrapeWebsiteDetails(lead.url, page);
      await page.close();

      // Fetch both mobile and desktop PageSpeed Insights data
      const mobileData = await fetchPageSpeedData(lead.url, 'mobile');
      const desktopData = await fetchPageSpeedData(lead.url, 'desktop');

      scrapedLeads.push({
        name: lead.name,
        url: lead.url,
        ...websiteDetails,
        pageSpeed: {
          mobile: mobileData.success ? mobileData.metrics : { error: 'Failed to fetch mobile data' },
          desktop: desktopData.success ? desktopData.metrics : { error: 'Failed to fetch desktop data' },
        },
      });
    }

    res.status(200).json(scrapedLeads);
  } catch (err) {
    console.error('Error in postScrapper:', err);
    res.status(500).json({ message: err.message });
  } finally {
    await browser.close();
  }
};
