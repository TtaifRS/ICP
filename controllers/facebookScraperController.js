import { scrapeFacebookFollowers } from '../utils/socialMediaScrapping.js';
import { scrapeFacebookAndMetaAdLibrary } from '../utils/adScraper.js';
import { blockUnnecessaryResources, launchBrowser } from '../utils/puppeteer.js';
import { chalkConsole } from '../helpers/utilsHelpers.js';


export const scrapeFacebookData = async (req, res) => {
  const browser = await launchBrowser()

  try {
    const leads = req.filterFacebookLeads;
    for (const { lead } of leads) {
      console.log(lead.socialMediaLinks.facebook)
      res.status(200).json({
        facebookUrl: lead.socialMediaLinks.facebook
      })
    }
  } catch (err) {
    chalkConsole(`Error in scrapeFacebookData: ${err.message}`, 'red')
    res.status(500).json({ message: err.message })
  } finally {
    await browser.close()
    chalkConsole('Browswe closed', 'blue')
  }
}