import { fetchCloseLeads } from '../apis/closeCrm.js';
import { scrapeWebsiteDetails } from '../utils/websiteScraper.js'; // Updated function


import { launchBrowser } from '../utils/puppeteer.js';
import { fetchPageSpeedData } from '../utils/pageSpeedApi.js';
import { searchWebsiteOnGoogle } from '../utils/googleSearch.js';
import { scrapeFacebookFollowers, scrapeInstagramFollowers, scrapeLinkedInData } from '../utils/socialMediaScrapping.js';
import { handleAuthWall } from '../helpers/authWallHelper.js';
import { scrapeFacebookAndMetaAdLibrary, scrapeGoogleAdTransparency } from '../utils/adScraper.js';

export const postScrapers = async (req, res) => {
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

    const searchPage = await browser.newPage();
    await searchWebsiteOnGoogle(searchPage, 'Wikipedia', 'https://www.wikipedia.org');
    console.log('Dummy search for "Wikipedia" completed.');

    const testLeads = leadDetails.slice(0, 20);

    for (const lead of testLeads) {
      const leadPage = await browser.newPage();

      // Step 1: Scrape website details
      const websiteDetails = await scrapeWebsiteDetails(lead.url, leadPage);
      await leadPage.close();

      if (!websiteDetails) {
        console.warn(`Failed to scrape website details for ${lead.url}`);
        continue; // Skip to the next lead
      }

      const { socialMediaLinks, imprintDetails, seoInfo } = websiteDetails;
      const { facebook, instagram, linkedin } = socialMediaLinks;

      let facebookFollowers = null;

      let metaAdLibrary = null;
      let instagramFollowers = null;
      let linkedinData = null;

      // Step 2: Scrape Facebook followers
      if (facebook) {
        const facebookPage = await browser.newPage();
        facebookFollowers = await scrapeFacebookFollowers(facebookPage, facebook);
        metaAdLibrary = await scrapeFacebookAndMetaAdLibrary(facebookPage, facebook)
        await facebookPage.close();
      }

      // Step 3: Scrape Instagram followers
      if (instagram) {
        instagramFollowers = await scrapeInstagramFollowers(searchPage, instagram);
      }

      // Step 4: Scrape LinkedIn industry with retry mechanism
      if (linkedin) {
        const linkedinPage = await browser.newPage();
        let retryCount = 0;

        while (retryCount < 2) {
          linkedinData = await scrapeLinkedInData(linkedinPage, linkedin);

          if (linkedinData) {
            break;
          } else {
            const retryBrowser = await launchBrowser();
            const retryPage = await retryBrowser.newPage()
            console.warn('LinkedIn auth wall detected. Retrying...');
            await handleAuthWall(browser, retryPage);
            linkedinData = await scrapeLinkedInData(retryPage, linkedin);
            if (linkedinData) {
              await retryBrowser.close()
              break
            } else {
              retryCount++;
            }


          }


        }

        if (!linkedinData) {
          console.warn(`Failed to scrape LinkedIn industry for ${linkedin} after retries.`);
        }

        await linkedinPage.close();
      }

      // Step 5: Scrape google ad 
      const adTransparencyData = await scrapeGoogleAdTransparency(searchPage, lead.url);

      // Step 6: Fetch PageSpeed data
      const mobileData = await fetchPageSpeedData(lead.url, 'mobile');
      const desktopData = await fetchPageSpeedData(lead.url, 'desktop');

      // Step 7: Search Google for ranking
      const { rank, matchingUrls } = await searchWebsiteOnGoogle(searchPage, lead.name, lead.url);

      // Step 8: Compile the results
      scrapedLeads.push({
        name: lead.name,
        url: lead.url,
        socialMediaLinks,
        facebookFollowers,
        instagramFollowers,
        linkedinData,
        imprintDetails,
        googleAdTransparency: adTransparencyData,
        metaAdLibrary,
        pageSpeed: {
          mobile: mobileData.success ? mobileData.metrics : { error: 'Failed to fetch mobile data' },
          desktop: desktopData.success ? desktopData.metrics : { error: 'Failed to fetch desktop data' },
        },
        googleSearch: {
          googleRank: rank,
          matchingUrls,
        },
        seoInfo,
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




















export const testFunction = async (req, res) => {
  const browser = await launchBrowser();
  try {


    const searchPage = await browser.newPage();
    await searchWebsiteOnGoogle(searchPage, 'Wikipedia', 'https://www.wikipedia.org');
    const websiteDetails = await scrapeWebsiteDetails("https://www.rentschpartner.ch/", searchPage);


    res.status(200).json(websiteDetails);
  }
  catch (err) {

  } finally {
    await browser.close()
  }
}