import { fetchCloseLeads } from '../apis/closeCrm.js';
import { scrapeWebsiteDetails } from '../utils/websiteScraper.js'; // Updated function
import { launchBrowser } from '../utils/puppeteer.js';
import { fetchPageSpeedData } from '../utils/pageSpeedApi.js';
import { searchWebsiteOnGoogle } from '../utils/googleSearch.js';

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

    const searchPage = await browser.newPage()
    await searchWebsiteOnGoogle(searchPage, 'Wikipedia', 'https://www.wikipedia.org');
    console.log('Dummy search for "Wikipedia" completed.');

    const testLeads = leadDetails.slice(0, 5);

    for (const lead of testLeads) {
      /* 
      * search website for social media, meta tag and contact info
       */
      const leadPage = await browser.newPage();
      const websiteDetails = await scrapeWebsiteDetails(lead.url, leadPage);
      await leadPage.close();

      /* 
      * fetch page speed and mobile friendly test 
       */
      // const mobileData = await fetchPageSpeedData(lead.url, 'mobile');
      // const desktopData = await fetchPageSpeedData(lead.url, 'desktop');

      /* 
      * search google for google ranking
       */
      const { rank, matchingUrls } = await searchWebsiteOnGoogle(searchPage, lead.name, lead.url);


      scrapedLeads.push({
        name: lead.name,
        url: lead.url,
        // ...websiteDetails,
        // pageSpeed: {
        //   mobile: mobileData.success ? mobileData.metrics : { error: 'Failed to fetch mobile data' },
        //   desktop: desktopData.success ? desktopData.metrics : { error: 'Failed to fetch desktop data' },
        // },
        googleSearch: {
          googleRank: rank,
          matchingUrls
        }
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
