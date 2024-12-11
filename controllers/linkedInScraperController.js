import { handleAuthWall } from '../helpers/authWallHelper.js';
import { chalkConsole } from '../helpers/utilsHelpers.js';
import Lead from '../models/leads.js';
import { blockUnnecessaryResources, launchBrowser } from '../utils/puppeteer.js';
import { scrapeLinkedInData } from '../utils/socialMediaScrapping.js';

/**
 * @swagger
 * /leads/all/update-linkedin-details:
 *   put:
 *     summary: Scrape LinkedIn data for leads with LinkedIn URLs and outdated scraping dates.
 *     tags:
 *       - Leads LinkedIn Scraping
 *     responses:
 *       200:
 *         description: LinkedIn data scraping process completed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leadsScraped:
 *                   type: number
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       linkedinUrl:
 *                         type: string
 *                       leadName:
 *                          type: string
 *                       leadUrl: 
 *                           type: string
 *                       scrapingData:
 *                         $ref: '#/components/schemas/LinkedinData'
 *                       success:
 *                         type: boolean
 *                       message:
 *                         type: string
 *       500:
 *         description: Server error during LinkedIn scraping.
 */

export const scrapeLinkedInController = async (req, res) => {
  const browser = await launchBrowser();
  const resultDetails = [];
  let leadsScrapedCount = 0;

  try {
    chalkConsole('Starting LinkedIn scraping process...', 'blue');

    // Fetch leads with LinkedIn URL and an outdated scraping date
    const leadsToScrape = await Lead.find({
      'socialMediaLinks.linkedin': { $exists: true, $ne: '' },
      $or: [
        { 'expireScrapingDate.linkedinScrapingDate': { $exists: false } },
        { 'expireScrapingDate.linkedinScrapingDate': { $lt: new Date() } },
      ],

    });

    if (leadsToScrape.length === 0) {
      chalkConsole('No leads found for LinkedIn scraping.', 'green');
      return res.status(200).json({
        message: 'No leads found for LinkedIn scraping.',
        leadsScraped: 0,
        details: [],
      });
    }

    chalkConsole(`${leadsToScrape.length} leads found for LinkedIn scraping.`, 'yellow');

    for (const lead of leadsToScrape) {
      const linkedinUrl = lead.socialMediaLinks.linkedin;
      chalkConsole(`Scraping LinkedIn data for ${linkedinUrl}`, 'yellow');

      const linkedinPage = await browser.newPage();
      await blockUnnecessaryResources(linkedinPage);

      let linkedinData = null;
      let retryCount = 0;

      while (retryCount < 2) {
        linkedinData = await scrapeLinkedInData(linkedinPage, linkedinUrl);

        if (linkedinData) {
          chalkConsole(`Successfully scraped LinkedIn data for ${linkedinUrl}`, 'green');
          break;
        } else {
          chalkConsole('LinkedIn auth wall detected. Retrying...', 'red');
          const retryBrowser = await launchBrowser();
          const retryPage = await retryBrowser.newPage();
          await handleAuthWall(retryBrowser, retryPage);

          chalkConsole(`Retrying scraping LinkedIn data for ${linkedinUrl}`, 'yellow');
          linkedinData = await scrapeLinkedInData(retryPage, linkedinUrl);
          await retryBrowser.close();

          if (linkedinData) {
            chalkConsole(`Successfully scraped LinkedIn data on retry for ${linkedinUrl}`, 'green');
            break;
          }
          retryCount++;
        }


      }

      if (linkedinData) {
        lead.linkedinData = linkedinData;
        lead.expireScrapingDate.linkedinScrapingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await lead.save();

        leadsScrapedCount++;
        resultDetails.push({
          leadName: lead.name,
          leadUrl: lead.companyUrl,
          linkedinUrl,
          scrapingData: linkedinData,
          success: true,
          message: 'Scraping successful',
        });

        chalkConsole(`Saved LinkedIn data for ${linkedinUrl}`, 'green');
      } else {
        resultDetails.push({
          leadName: lead.name,
          leadUrl: lead.companyUrl,
          linkedinUrl,
          success: false,
          message: 'Failed to scrape data after retries',
        });

        chalkConsole(`Failed to scrape LinkedIn data for ${linkedinUrl} after retries.`, 'red');
      }

      await linkedinPage.close();
    }

    chalkConsole('LinkedIn scraping process completed.', 'blue');
    return res.status(200).json({
      message: 'LinkedIn data scraping process completed successfully.',
      leadsScraped: leadsScrapedCount,
      details: resultDetails,
    });
  } catch (error) {
    chalkConsole(`Error during LinkedIn scraping: ${error.message}`, 'red');
    return res.status(500).json({
      message: 'Server error during LinkedIn scraping.',
      error: error.message,
    });
  } finally {
    await browser.close();
    chalkConsole('Browser closed.', 'blue');
  }
};
