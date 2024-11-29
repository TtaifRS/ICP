import axios from 'axios'

/*
? Get all the close leads 
*/
export const fetchCloseLeads = async () => {
  const apiEndPoint = 'https://api.close.com/api/v1/lead/';
  try {
    const response = await axios.get(apiEndPoint, {
      auth: {
        username: process.env.API_KEY,
        password: '',
      },
      headers: {
        Accept: 'application/json',
      },
    });
    const leads = response.data?.data || [];
    const leadDetails = leads.map((lead) => ({
      url: lead.url,
      name: lead.name,
      success: true
    }));

    return leadDetails;

  } catch (err) {

    if (err.response) {
      throw new Error(
        `Close CRM API Error: ${err.response.status} - ${err.response.data.error || 'Unknown error'}`
      );
    } else {
      throw new Error('Failed to fetch leads from Close CRM API. Network error or server issue.');
    }
  }
};