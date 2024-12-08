import Lead from '../models/leads.js';
import { scrapeWebsiteDetails } from '../utils/websiteScraper.js';
import { chalkConsole } from '../helpers/utilsHelpers.js';
import { blockUnnecessaryResources, launchBrowser } from '../utils/puppeteer.js';

export const scrapeWebsiteData = async (req, res) => {
  const browser = await launchBrowser();
  let aborted = false;

  req.on('aborted', () => {
    aborted = true;
    chalkConsole('Client disconnected. Aborting process.', 'red');
  });

  try {
    const leads = await Lead.find({
      url: { $exists: true, $ne: '', $ne: null },
      $or: [
        { 'expireScrapingDate.websiteScrapingDate': { $exists: false } },
        { 'expireScrapingDate.websiteScrapingDate': { $lt: new Date() } },
      ],
    });

    const urlGroups = leads.reduce((acc, lead) => {
      if (!acc[lead.url]) acc[lead.url] = [];
      acc[lead.url].push(lead);
      return acc;
    }, {});

    const processedLeads = [];

    for (const [url, groupedLeads] of Object.entries(urlGroups)) {
      if (aborted) break; // Stop if the client disconnects
      const leadNames = groupedLeads.map((lead) => lead.name).join(', ');
      chalkConsole(`Scraping website data for ${leadNames} (${url})`, 'yellow');

      const page = await browser.newPage();
      await blockUnnecessaryResources(page);

      const websiteDetails = await scrapeWebsiteDetails(url, page);
      await page.close();

      if (!websiteDetails) {
        chalkConsole(`Failed to scrape website data for ${url}`, 'red');
        continue;
      }

      const { socialMediaLinks, imprintDetails, seoInfo } = websiteDetails;
      const expireScrapingDate = {
        websiteScrapingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const updatePromises = groupedLeads.map((lead) =>
        Lead.updateOne(
          { _id: lead._id },
          {
            socialMediaLinks,
            imprintDetails,
            seoInfo,
            'expireScrapingDate.websiteScrapingDate': expireScrapingDate.websiteScrapingDate,
          }
        )
      );

      await Promise.all(updatePromises);
      processedLeads.push({ url, socialMediaLinks, imprintDetails, seoInfo });

      chalkConsole(`Website data scraped and updated for ${url}`, 'green');
    }

    if (!aborted) {
      res.status(200).json({
        message: 'Website data scraped successfully.',
        data: processedLeads,
      });
    }
  } catch (err) {
    chalkConsole(`Error in scrapeWebsiteData: ${err.message}`, 'red');
    if (!aborted) res.status(500).json({ message: err.message });
  } finally {
    await browser.close();
    chalkConsole('Browser closed.', 'blue');
  }
};



export const scrapeTestWebsiteData = async (req, res) => {
  const browser = await launchBrowser();

  try {
    // Fetch only leads that have a valid URL and require scraping based on websiteScrapingDate
    const leads = await Lead.find({
      url: { $exists: true, $ne: '', $ne: null },
      $or: [
        { 'expireScrapingDate.websiteScrapingDate': { $exists: false } }, // No websiteScrapingDate
        { 'expireScrapingDate.websiteScrapingDate': { $lt: new Date() } }, // Expired websiteScrapingDate
      ],
    });

    // Take only the first 20 leads for testing
    const limitedLeads = leads.slice(0, 20);

    // Group leads by URL to handle duplicates
    const urlGroups = limitedLeads.reduce((acc, lead) => {
      if (!acc[lead.url]) acc[lead.url] = [];
      acc[lead.url].push(lead);
      return acc;
    }, {});

    const processedLeads = [];

    for (const [url, groupedLeads] of Object.entries(urlGroups)) {
      const leadNames = groupedLeads.map((lead) => lead.name).join(', ');
      chalkConsole(`Scraping website data for ${leadNames} (${url})`, 'yellow');

      const page = await browser.newPage();
      await blockUnnecessaryResources(page);

      const websiteDetails = await scrapeWebsiteDetails(url, page);
      await page.close();

      if (!websiteDetails) {
        chalkConsole(`Failed to scrape website data for ${url}`, 'red');
        continue;
      }

      const { socialMediaLinks, imprintDetails, seoInfo } = websiteDetails;
      const websiteScrapingDate = new Date(); // Current date for website scraping
      const expireScrapingDate = {
        websiteScrapingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from today
      };

      // Update all leads with the same URL
      const updatePromises = groupedLeads.map((lead) =>
        Lead.updateOne(
          { _id: lead._id },
          {
            socialMediaLinks,
            imprintDetails,
            seoInfo,
            'expireScrapingDate.websiteScrapingDate': expireScrapingDate.websiteScrapingDate,
          }
        )
      );

      await Promise.all(updatePromises);

      processedLeads.push({ url, socialMediaLinks, imprintDetails, seoInfo });

      chalkConsole(`Website data scraped and updated for ${url}`, 'green');
    }

    res.status(200).json({
      message: 'Website data scraped successfully.',
      data: processedLeads,
    });
  } catch (err) {
    chalkConsole(`Error in scrapeWebsiteData: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  } finally {
    await browser.close();
    chalkConsole('Browser closed.', 'blue');
  }
};