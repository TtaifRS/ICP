import Lead from '../models/leads.js';
import { scrapeWebsiteDetails } from '../utils/websiteScraper.js';
import { chalkConsole } from '../helpers/utilsHelpers.js';
import { blockUnnecessaryResources, launchBrowser } from '../utils/puppeteer.js';


/**
 * @swagger
 * /leads/all/update-website-details:
 *   put:
 *     summary: Scrape website data for all leads with valid URLs and update their details.
 *     tags:
 *       - Leads Website Details
 *     responses:
 *       200:
 *         description: Website data scraped successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       socialMediaLinks:
 *                         $ref: '#/components/schemas/SocialMediaLinks'
 *                       imprintDetails:
 *                         $ref: '#/components/schemas/ImprintDetails'
 *                       seoInfo:
 *                         $ref: '#/components/schemas/SEOInfo'
 *       500:
 *         description: Server error.
 */


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



/**
 * @swagger
 * /leads/with-website-data:
 *   get:
 *     summary: Fetch leads with website scraping data.
 *     tags:
 *       - Leads Website Details
 *     parameters:
 *       - name: socialMediaLinks
 *         in: query
 *         description: Filter leads with social media links. 
 *         required: false
 *         schema:
 *           type: string
 *       - name: imprintDetails
 *         in: query
 *         description: Filter leads with imprint details.
 *         required: false
 *         schema:
 *           type: string
 *       - name: seoInfo
 *         in: query
 *         description: Filter leads with SEO information.
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leads fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *       500:
 *         description: Server error.
 */

export const getLeadsWithWebsiteData = async (req, res) => {
  try {
    const { socialMediaLinks, imprintDetails, seoInfo } = req.query;

    // Build the filter dynamically based on query parameters
    const filter = {};
    if (socialMediaLinks === 'true') filter.socialMediaLinks = { $exists: true };
    if (imprintDetails === 'true') filter.imprintDetails = { $exists: true };
    if (seoInfo === 'true') filter.seoInfo = { $exists: true };

    const leads = await Lead.find(filter);

    res.status(200).json({
      message: 'Leads with website scraping data fetched successfully.',
      data: leads,
    });
  } catch (err) {
    chalkConsole(`Error in getLeadsWithWebsiteData: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  }
};


/**
 * @swagger
 * /leads/{id}/update-website-details:
 *   put:
 *     summary: Scrape and update website details for a specific lead.
 *     tags:
 *       - Leads Website Details
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Lead ID.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Website details updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WebsiteDetails'
 *       404:
 *         description: Lead not found.
 *       400:
 *         description: Invalid URL or failed to scrape website details.
 *       500:
 *         description: Server error.
 */

export const updateWebsiteDetailsForLead = async (req, res) => {
  const { id } = req.params;
  const browser = await launchBrowser();

  try {
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    if (!lead.url) {
      return res.status(400).json({ message: 'Lead does not have a valid URL.' });
    }

    chalkConsole(`Scraping website data for ${lead.name} (${lead.url})`, 'yellow');

    const page = await browser.newPage();
    await blockUnnecessaryResources(page);

    const websiteDetails = await scrapeWebsiteDetails(lead.url, page);
    await page.close();

    if (!websiteDetails) {
      return res.status(400).json({ message: 'Failed to scrape website details.' });
    }

    const { socialMediaLinks, imprintDetails, seoInfo } = websiteDetails;
    const expireScrapingDate = {
      websiteScrapingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    await Lead.updateOne(
      { _id: id },
      {
        socialMediaLinks,
        imprintDetails,
        seoInfo,
        'expireScrapingDate.websiteScrapingDate': expireScrapingDate.websiteScrapingDate,
      }
    );

    chalkConsole(`Website details updated for lead ${lead.name}`, 'green');

    res.status(200).json({
      message: 'Website details updated successfully.',
      data: { socialMediaLinks, imprintDetails, seoInfo },
    });
  } catch (err) {
    chalkConsole(`Error in updateWebsiteDetailsForLead: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  } finally {
    await browser.close();
    chalkConsole('Browser closed.', 'blue');
  }
};