import Lead from '../models/leads.js';
import { chalkConsole } from '../helpers/utilsHelpers.js';

export const filterWebsiteLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({
      url: { $exists: true, $ne: '', $ne: null },
      $or: [
        { 'expireScrapingDate.websiteScrapingDate': { $exists: false } }, // No websiteScrapingDate
        { 'expireScrapingDate.websiteScrapingDate': { $lt: new Date() } }, // Expired websiteScrapingDate
      ],
    });

    if (leads.length === 0) {
      chalkConsole('No leads to scrape.', 'yellow');
      return res.status(200).json({ message: 'No leads to scrape.' });
    }

    // Attach filtered leads to the request object
    req.filteredLeads = leads;

    chalkConsole(`${leads.length} leads filtered successfully.`, 'green');
    next();
  } catch (err) {
    chalkConsole(`Error in filterLeads middleware: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  }
};
