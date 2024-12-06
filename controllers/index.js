import { fetchCloseLeads } from '../apis/closeCrm.js';

import { blockUnnecessaryResources, launchBrowser } from '../utils/puppeteer.js';
import { scrapeWebsiteDetails } from '../utils/websiteScraper.js';
import { fetchPageSpeedData } from '../utils/pageSpeedApi.js';
import { searchWebsiteOnGoogle } from '../utils/googleSearch.js';
import { scrapeFacebookFollowers, scrapeInstagramFollowers, scrapeLinkedInData } from '../utils/socialMediaScrapping.js';
import { scrapeFacebookAndMetaAdLibrary, scrapeGoogleAdTransparency } from '../utils/adScraper.js';

import { handleAuthWall } from '../helpers/authWallHelper.js';
import { chalkConsole } from '../helpers/utilsHelpers.js';


export const postScrapers = async (req, res) => {
  const scrapedLeads = [];
  const browser = await launchBrowser();

  try {
    const { leads, success } = await fetchCloseLeads();


    if (!success) {
      chalkConsole('Failed to fetch leads from Close CRM.', 'red');
      return res.status(500).json({ message: 'Failed to fetch leads from Close CRM.' });
    }

    chalkConsole('Fetched leads from Close CRM successfully.', 'green');

    const leadDetails = leads.map((lead) => ({
      url: lead.url,
      name: lead.name,
    }));

    const searchPage = await browser.newPage();
    await blockUnnecessaryResources(searchPage);

    await searchWebsiteOnGoogle(searchPage, 'Wikipedia', 'https://www.wikipedia.org');
    chalkConsole('Dummy search for "Wikipedia" completed.', 'blue');

    const testLeads = leadDetails.slice(0, 20);

    for (const [index, lead] of testLeads.entries()) {
      chalkConsole(`Processing lead ${index + 1} of ${testLeads.length}: ${lead.name || 'unknown'}`, 'cyan');

      if (!lead.url) {
        chalkConsole(`Skipping lead ${lead.name || 'unknown'} due to missing URL.`, 'red');
        continue;
      }

      const leadPage = await browser.newPage();
      await blockUnnecessaryResources(leadPage)

      // Step 1: Scrape website details
      chalkConsole(`Step 1: Scraping website details from ${lead.url}`, 'yellow');
      const websiteDetails = await scrapeWebsiteDetails(lead.url, leadPage);
      await leadPage.close();

      if (!websiteDetails) {
        chalkConsole(`Failed to scrape website details for ${lead.url}`, 'red');
        continue;
      }
      chalkConsole(`Step 1 completed: Scraped website details for ${lead.url}`, 'green');

      const { socialMediaLinks, imprintDetails, seoInfo } = websiteDetails;
      const { facebook, instagram, linkedin } = socialMediaLinks;

      let facebookFollowers = null;
      let metaAdLibrary = null;
      let instagramFollowers = null;
      let linkedinData = null;

      // Step 2: Scrape Facebook followers
      if (facebook) {
        chalkConsole(`Step 2.1: Scraping Facebook data for ${facebook}`, 'yellow');
        const facebookPage = await browser.newPage();
        await blockUnnecessaryResources(facebookPage)
        facebookFollowers = await scrapeFacebookFollowers(facebookPage, facebook);
        chalkConsole(`Step 2.2: Scraping Meta ad library for ${facebook}`, 'yellow');
        metaAdLibrary = await scrapeFacebookAndMetaAdLibrary(facebookPage, facebook);
        await facebookPage.close();
        chalkConsole(`Step 2 completed: Scraped Facebook data and ad for ${facebook}`, 'green');
      }

      // Step 3: Scrape Instagram followers
      if (instagram) {
        chalkConsole(`Step 3: Scraping Instagram data for ${instagram}`, 'yellow');
        instagramFollowers = await scrapeInstagramFollowers(searchPage, instagram);
        chalkConsole(`Step 3 completed: Scraped Instagram data for ${instagram}`, 'green');
      }

      // Step 4: Scrape LinkedIn industry with retry mechanism
      if (linkedin) {
        chalkConsole(`Step 4: Scraping LinkedIn data for ${linkedin}`, 'yellow');
        const linkedinPage = await browser.newPage();
        await blockUnnecessaryResources(linkedinPage)
        let retryCount = 0;

        while (retryCount < 2) {
          linkedinData = await scrapeLinkedInData(linkedinPage, linkedin);

          if (linkedinData) {
            break;
          } else {
            chalkConsole('LinkedIn auth wall detected. Retrying...', 'red');
            const retryBrowser = await launchBrowser();
            const retryPage = await retryBrowser.newPage();
            await handleAuthWall(browser, retryPage);
            chalkConsole(`Step 4: Scraping LinkedIn data for ${linkedin}`, 'yellow');
            linkedinData = await scrapeLinkedInData(retryPage, linkedin);
            if (linkedinData) {
              await retryBrowser.close();
              break;
            }

          }

          retryCount++;
        }

        if (linkedinData) {
          chalkConsole(`Step 4 completed: Scraped LinkedIn data for ${linkedin}`, 'green');
        } else {
          chalkConsole(`Failed to scrape LinkedIn data for ${linkedin} after retries.`, 'red');
        }

        await linkedinPage.close();
      }

      // Step 5: Scrape Google ad transparency data
      chalkConsole(`Step 5: Scraping Google ad transparency data for ${lead.url}`, 'yellow');
      const adTransparencyData = await scrapeGoogleAdTransparency(searchPage, lead.url);
      chalkConsole(`Step 5 completed: Scraped Google ad transparency data for ${lead.url}`, 'green');

      // Step 6: Fetch PageSpeed data
      chalkConsole(`Step 6.1: Fetching Mobile PageSpeed data for ${lead.url}`, 'yellow');
      const mobileData = await fetchPageSpeedData(lead.url, 'mobile');
      chalkConsole(`Step 6.2: Fetching Desktop PageSpeed data for ${lead.url}`, 'yellow');
      const desktopData = await fetchPageSpeedData(lead.url, 'desktop');
      chalkConsole(`Step 6 completed: Fetched PageSpeed data for ${lead.url}`, 'green');

      // Step 7: Search Google for ranking
      chalkConsole(`Step 7: Searching Google for ranking of ${lead.name}`, 'yellow');
      const { rank, matchingUrls } = await searchWebsiteOnGoogle(searchPage, lead.name, lead.url);
      chalkConsole(`Step 7 completed: Searched Google for ranking of ${lead.name}`, 'green');

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

    chalkConsole('All leads processed successfully.', 'green');
    res.status(200).json(scrapedLeads);
  } catch (err) {
    chalkConsole(`Error in postScrapers: ${err.message}`, 'red');
    res.status(500).json({ message: err.message });
  } finally {
    await browser.close();
    chalkConsole('Browser closed.', 'blue');
  }
};











export const testRender = async (req, res) => {
  try {
    res.status(200).json({ message: "Render is working..." })
  } catch (err) {
    res.status(401).json({ message: "something went wrong" })
  }
}








export const testFunction = async (req, res) => {
  const browser = await launchBrowser();
  try {


    const searchPage = await browser.newPage();
    await searchWebsiteOnGoogle(searchPage, 'Wikipedia', 'https://www.wikipedia.org');
    const websiteDetails = await scrapeWebsiteDetails(' https://hutterdynamics.ch/', searchPage)
    res.status(200).json({
      websiteDetails
    });
  }
  catch (err) {

  } finally {
    await browser.close()
  }
}