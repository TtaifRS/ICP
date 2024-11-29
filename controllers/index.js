import { fetchCloseLeads } from '../apis/closeCrm.js';


export const postScrapper = async (req, res) => {
  try {
    const leads = await fetchCloseLeads()

    res.status(200).json(leads)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
}

