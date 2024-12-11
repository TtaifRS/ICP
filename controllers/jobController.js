

import { chalkConsole } from '../helpers/utilsHelpers.js';

import JobLead from '../models/jobLeads.js';
import Progress from '../models/progress.js';

import { extractIndeedJobListings } from '../utils/extractIndeedJob.js';
import { blockUnnecessaryResources, launchBrowser, navigateToJobLink } from '../utils/puppeteer.js';
import { jobTitles } from '../data/jobTitles.js';
import { randomWait } from '../helpers/authWallHelper.js';
import { extractStepStonesListing, handlePagination } from '../utils/extractStepstonesJob.js';
import { scrapeGoogleMap } from '../utils/googleMapScraper.js';



export const scrapeAndSaveIndeedLeads = async (req, res) => {
  const numPages = 5; // Number of pages to scrape concurrently
  const today = new Date().toISOString().split('T')[0];
  const retryLimit = 3;
  let browser = null; // Centralized browser instance

  try {
    chalkConsole('Starting the job scraping process...', 'blueBright');

    let retries = 0;
    let success = false;

    while (!success && retries < retryLimit) {
      try {
        // Launch the browser only if not already running
        if (!browser) {
          browser = await launchBrowser();
        }

        let progress = await Progress.findOne({ date: today, source: 'indeed' });
        if (!progress) {
          progress = new Progress({ date: today, source: 'indeed', completedTitles: [] });
        }

        const completedTitles = progress.completedTitles.map((item) => item.title);
        const remainingTitles = jobTitles.filter(title => !completedTitles.includes(title));

        if (remainingTitles.length === 0) {
          chalkConsole('All job titles have already been scraped for today.', 'green');
          break;
        }

        chalkConsole(`Remaining titles to scrape: ${remainingTitles.length}`, 'blueBright');

        for (const [index, title] of remainingTitles.entries()) {
          chalkConsole(`\nScraping jobs for title (${index + 1}/${remainingTitles.length}): ${title}`, 'green');
          let pageNumber = 0;
          let keepScraping = true;
          let leadsAddedForTitle = 0;

          while (keepScraping) {
            const pageUrls = Array.from({ length: numPages }, (_, i) => {
              const formattedTitle = title.replace(/\s+/g, '+');
              return `https://de.indeed.com/jobs?q=${formattedTitle}&start=${(pageNumber + i) * 10}&fromage=1`;
            });

            const pageTasks = pageUrls.map(async (url) => {
              const page = await browser.newPage();
              await blockUnnecessaryResources(page);

              try {
                chalkConsole(`Scraping URL: ${url}`, 'blue');
                const navigationSuccess = await navigateToJobLink(page, url);
                if (!navigationSuccess) throw new Error(`Failed to navigate to ${url}`);

                const resultSelector = await Promise.race([
                  page.waitForSelector('td.resultContent', { timeout: 60000 }).then(() => 'results'),
                  page.waitForSelector('main.error', { timeout: 60000 }).then(() => 'error'),
                  page.waitForSelector('div.jobsearch-NoResult-messageContainer', { timeout: 60000 }).then(() => 'noResults')
                ]);

                if (resultSelector === 'noResults') {
                  chalkConsole('No job listings available for this job title. Moving to the next title.', 'yellow');
                  await page.close();
                  return 'noResults';
                }

                if (resultSelector === 'results') {
                  const jobListings = extractIndeedJobListings(await page.content());
                  await page.close();
                  return jobListings;
                }
              } catch (err) {
                console.error(`Error processing URL: ${url},`, err);
                await page.close();
                return [];
              }
            });

            const results = await Promise.all(pageTasks);

            if (results.includes('noResults')) {
              keepScraping = false;
              break;
            }

            const jobListings = results.flat();

            if (jobListings.length === 0) {
              chalkConsole('No job listings found on these pages.', 'yellow');
              keepScraping = false;
              break;
            }

            for (const job of jobListings) {
              let lead = await JobLead.findOne({ companyName: job.company });

              if (!lead) {
                lead = new JobLead({
                  companyName: job.company,
                  location: job.location,
                  jobs: [],
                  processed: false
                });
              }

              const jobExists = lead.jobs.some((existingJob) => {
                const existingJobDate = new Date(existingJob.jobDate).toDateString();
                const newJobDate = new Date(job.datePosted).toDateString();
                return existingJob.jobTitle === job.title && existingJobDate === newJobDate;
              });

              if (!jobExists) {
                lead.jobs.push({
                  jobTitle: job.title,
                  jobLink: job.link,
                  jobDate: job.datePosted,
                  jobSource: 'indeed',
                });
                leadsAddedForTitle++;
              }

              try {
                await lead.save();
              } catch (err) {
                console.error('Error saving lead to MongoDB:', err);
              }
            }

            const page = await browser.newPage();
            const navigationSuccess = await navigateToJobLink(page, pageUrls[0]);

            if (!navigationSuccess) {
              keepScraping = false;
            } else {
              try {
                const nextPageButton = await page.$('a[data-testid="pagination-page-next"]');
                if (nextPageButton) {
                  chalkConsole('Next page button found, continuing to next batch of pages.', 'green');
                  pageNumber += numPages;
                } else {
                  chalkConsole('No more pages available for this title.', 'yellow');
                  keepScraping = false;
                }
              } catch (err) {
                chalkConsole('Error finding next page button:', err);
                keepScraping = false;
              }
              await page.close();
            }

            await randomWait(2000, 5000);
          }

          chalkConsole(`Leads added for job title "${title}": ${leadsAddedForTitle}`, 'green');

          progress.completedTitles.push({
            title: title,
            leadsAdded: leadsAddedForTitle,
          });
          await progress.save();
        }

        success = true;
      } catch (err) {
        retries++;
        console.error(`Error encountered, retrying (${retries}/${retryLimit}):`, err);

        // Ensure the browser is properly closed before retrying
        if (browser) {
          await browser.close();
          browser = null;
        }
      }
    }

    if (browser) await browser.close();

    if (success) {
      res.status(200).json({ message: 'Job leads successfully scraped and saved to MongoDB.' });
    } else {
      res.status(500).json({ message: 'Failed to scrape all job titles after retries.' });
    }
  } catch (err) {
    if (browser) await browser.close();
    console.error('Unexpected error in scraping process:', err);
    res.status(500).json({ message: 'Unexpected error occurred', error: err.message });
  }
};



export const scrapeAndSaveStepstonesLeads = async (req, res) => {

  const today = new Date().toISOString().split('T')[0];
  const retryLimit = 3;
  const retryDelay = 10000; // Wait 10 seconds before retrying in case of a major error

  try {
    chalkConsole('Starting the StepStone job scraping process...', 'blueBright');

    let browser;

    let allScraped = false; // Flag to check if all titles have been scraped

    while (!allScraped) {
      try {
        browser = await launchBrowser();
        let progress = await Progress.findOne({ date: today, source: 'stepstone' });
        if (!progress) {
          progress = new Progress({ date: today, source: 'stepstone', completedTitles: [] });
        }


        const completedTitles = progress.completedTitles.map((item) => item.title);
        let remainingTitles = jobTitles.filter(title => !completedTitles.includes(title));

        if (remainingTitles.length === 0) {
          chalkConsole('All job titles have already been scraped for today.', 'green');
          allScraped = true; // All titles scraped, exit loop
          break;
        }

        chalkConsole(`Remaining titles to scrape: ${remainingTitles.length}`, 'blueBright');

        for (const [index, title] of remainingTitles.entries()) {
          chalkConsole(`\nScraping jobs for title (${index + 1}/${remainingTitles.length}): ${title}`, 'yellow');
          let keepScraping = true;
          let leadsAddedForTitle = 0;

          const formattedTitle = title.replace(/\s+/g, '-');
          const firstPageUrl = `https://www.stepstone.de/work/${formattedTitle}?ag=age_1`;
          const page = await browser.newPage();
          await blockUnnecessaryResources(page);  // Block unnecessary resources to optimize

          // Navigate to the first page
          const navigationSuccess = await navigateToJobLink(page, firstPageUrl);
          if (!navigationSuccess) throw new Error(`Failed to navigate to ${firstPageUrl}`);

          // Scrape jobs from the first page before pagination
          chalkConsole(`Scraping jobs from the first page...`, 'yellow');
          await page.waitForSelector('div[data-at="resultlist-flex-container"]', { timeout: 60000 });

          const jobListings = extractStepStonesListing(await page.content());

          // Save job listings to MongoDB
          for (const job of jobListings) {
            if (!job.companyName || !job.jobTitle || !job.jobLink) {
              console.log(chalk.yellow(`Incomplete job found and ignored: ${JSON.stringify(job)}`));
              continue;
            }

            let lead = await JobLead.findOne({ companyName: job.companyName });
            if (!lead) {
              lead = new JobLead({
                companyName: job.companyName,
                location: job.companyLocation,
                jobs: [],
                processed: false

              });
            }

            const jobExists = lead.jobs.some(existingJob => {
              const existingJobDate = new Date(existingJob.jobDate).toDateString();
              const newJobDate = new Date(job.datePosted).toDateString();
              return existingJob.jobTitle === job.jobTitle && existingJobDate === newJobDate;
            });

            if (!jobExists) {
              lead.jobs.push({
                jobTitle: job.jobTitle,
                jobLink: job.jobLink,
                jobDate: job.datePosted || new Date(),
                jobSource: 'stepstone'
              });
              leadsAddedForTitle++;
            }

            try {
              await lead.save();
            } catch (err) {
              console.error('Error saving lead to MongoDB:', err);
            }
          }

          // Start handling pagination for pages 2 and onward
          while (keepScraping) {
            try {
              // Handle pagination and navigate to the next page
              const nextPageExists = await handlePagination(page);

              // Wait between 10 and 20 seconds before navigating to the next page
              if (nextPageExists) {
                await randomWait(10000, 20000);  // Wait before going to the next page

              } else {
                keepScraping = false;  // Stop if there are no more pages
              }

            } catch (err) {
              console.error('Error during Stepstone scraping:', err);
              keepScraping = false;  // Stop scraping on error
            }
          }

          // Update progress for the current title
          progress.completedTitles.push({
            title: title,
            leadsAdded: leadsAddedForTitle,
          });
          await progress.save();

        }

        await browser.close();

        // Recheck if all titles have been scraped
        let updatedRemainingTitles = jobTitles.filter(title => !progress.completedTitles.map(t => t.title).includes(title));
        if (updatedRemainingTitles.length === 0) {
          allScraped = true;
        }
      } catch (err) {
        console.error(`Error encountered, will retry after waiting:`, err);
        if (browser) await browser.close();
        await randomWait(retryDelay);  // Wait before retrying
      }
    }

    if (allScraped) {
      res.status(200).json({ message: 'StepStone job leads successfully scraped and saved to MongoDB.' });
    } else {
      res.status(500).json({ message: 'Failed to scrape all StepStone job titles after retries.' });
    }
  } catch (err) {
    console.error(chalk.red('Unexpected error in scraping process:', err));
    res.status(500).json({ message: 'Unexpected error occurred', error: err.message });
  }
};





export const getJobLeads = async (req, res) => {
  try {
    chalkConsole('Fetching all leads...', 'blue');

    // Fetch all leads from the database
    const leads = await JobLead.find();
    const totalLeads = leads.length; // Get total number of leads

    // Log the total number of leads
    chalkConsole(`Total number of leads: ${totalLeads}`, 'green');

    // Send the leads back in the response
    res.status(200).json({ totalLeads, leads });
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    res.status(500).json({ message: 'Failed to fetch leads', error: err.message });
  }
};


export const updateCompanyUrlswithGoogleMap = async (req, res) => {
  const batchSize = 10; // Process in batches
  let successCount = 0;
  let errorCount = 0;

  try {
    // Launch Puppeteer
    const browser = await launchBrowser()
    const page = await browser.newPage();

    let hasMoreLeads = true;

    while (hasMoreLeads) {

      const leads = await JobLead.find({ processed: false }).limit(batchSize);
      console.log(leads)

      if (leads.length === 0) {
        hasMoreLeads = false;
        break;
      }

      for (const lead of leads) {
        const { companyName, location } = lead;

        try {

          const result = await scrapeGoogleMap(page, companyName, location);

          if (result.websiteUrl) {
            lead.companyURL = result.websiteUrl;
          } else {
            console.warn(`No website found for ${companyName} at ${location}`);
          }


          lead.processed = true;
          await lead.save();
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to update companyURL for ${companyName}:`, error);
        }
      }
    }

    // Close Puppeteer
    await browser.close();

    res.status(200).json({
      message: `Process completed. Successfully updated ${successCount} records. ${errorCount} errors occurred.`,
    });
  } catch (error) {
    console.error('Error in updateCompanyUrls controller:', error);
    res.status(500).json({ error: 'An error occurred while updating company URLs.' });
  }
};



export const deleteAllLeadsAndProgress = async (req, res) => {
  try {
    console.log('Deleting all leads and progress entries...');

    // Delete all leads
    const leadDeleteResult = await JobLead.deleteMany({});
    console.log(`Deleted ${leadDeleteResult.deletedCount} job leads.`);

    // Delete all progress entries
    const progressDeleteResult = await Progress.deleteMany({});
    console.log(`Deleted ${progressDeleteResult.deletedCount} progress entries.`);

    // Respond with success message
    res.status(200).json({
      message: 'Successfully deleted all leads and progress entries.',
      deletedLeads: leadDeleteResult.deletedCount,
      deletedProgressEntries: progressDeleteResult.deletedCount,
    });
  } catch (err) {
    console.error('Failed to delete leads and progress:', err);
    res.status(500).json({
      message: 'Failed to delete leads and progress.',
      error: err.message,
    });
  }
};