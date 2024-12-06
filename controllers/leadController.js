import Lead from '../models/leads.js';
import { fetchCloseLeads } from '../apis/closeCrm.js';
import { chalkConsole } from '../helpers/utilsHelpers.js';

/**
 * Fetch all leads from close CRM and save to mongoDB 
 */

export const fetchAndSaveCloseLeads = async (req, res) => {
  try {
    const { leads, success } = await fetchCloseLeads();

    if (!success) {
      chalkConsole('Failed to fetch leads from Close CRM.', 'red');
      return res.status(500).json({ message: 'Failed to fetch leads from Close CRM.' });
    }

    chalkConsole('Fetched leads from Close CRM successfully.', 'green');

    const formattedLeads = leads.map(({ url, name, id }) => {
      return { url, name, closeId: id };
    });

    // Filter out duplicates by checking closeId in the database
    const existingCloseIds = await Lead.find(
      { closeId: { $in: formattedLeads.map((lead) => lead.closeId) } },
      { closeId: 1 } // Only return closeId to optimize the query
    ).lean();

    const existingCloseIdSet = new Set(existingCloseIds.map((lead) => lead.closeId));

    const newLeads = formattedLeads.filter(
      (lead) => !existingCloseIdSet.has(lead.closeId)
    );

    if (newLeads.length > 0) {
      await Lead.insertMany(newLeads, { ordered: false });
      chalkConsole(`${newLeads.length} new leads saved successfully.`, 'green');
    } else {
      chalkConsole('No new leads to save.', 'yellow');
    }

    res.status(200).json({ message: 'Leads fetched and saved successfully.', newLeadsCount: newLeads.length });
  } catch (err) {
    chalkConsole(`Error in fetchAndSaveCloseLeads: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  }
};



/**
 * Get All leads from MongoDB
 */

export const getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find().lean(); // Using `.lean()` for better performance
    chalkConsole(`Fetched ${leads.length} leads successfully.`, 'green');
    res.status(200).json({ message: 'All leads fetched successfully.', leads });
  } catch (err) {
    chalkConsole(`Error in getAllLeads: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  }
};






/**
 * Delete All leads from MongoDB
 */

export const deleteAllLeads = async (req, res) => {
  try {
    const result = await Lead.deleteMany({});
    chalkConsole(`Deleted ${result.deletedCount} leads successfully.`, 'green');
    res.status(200).json({ message: 'All leads deleted successfully.', deletedCount: result.deletedCount });
  } catch (err) {
    chalkConsole(`Error in deleteAllLeads: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  }
};