import * as cheerio from 'cheerio';
import chalk from 'chalk';



export const extractStepStonesListing = (html) => {
  const $ = cheerio.load(html);
  const jobs = [];
  const incompleteJobs = []; // To store incomplete jobs for logging

  $('article').each((i, element) => {
    const companyName = $(element).find('span[data-at="job-item-company-name"] span[data-genesis-element="TEXT"]').text().trim() || '';
    const companyLocation = $(element).find('span[data-at="job-item-location"] span[data-genesis-element="TEXT"]').text().trim() || '';
    const jobLink = $(element).find('h2[data-genesis-element="BASE"] a[data-at="job-item-title"]').attr('href');
    const fullJobLink = jobLink ? `https://www.stepstone.de${jobLink}` : '';
    const jobTitle = $(element).find('h2[data-genesis-element="BASE"] a[data-at="job-item-title"] div[data-genesis-element="BASE"] div[data-genesis-element="BASE"] div[data-genesis-element="BASE"]').text().trim() || '';

    // Only add jobs that have all required fields
    if (companyName && jobTitle && fullJobLink) {
      jobs.push({
        companyName,
        companyLocation,
        jobTitle,
        jobLink: fullJobLink,
      });
    } else {
      incompleteJobs.push({
        companyName,
        companyLocation,
        jobTitle,
        jobLink: fullJobLink,
      });
    }
  });


  return jobs;
};




export const handlePagination = async (page) => {
  try {
    // Get the page's HTML content and load it with Cheerio
    let html = await page.content();
    let $ = cheerio.load(html);

    // Extract total number of pages from pagination (if needed)
    const activePage = $('[aria-current="true"]');
    let totalPages = 1; // Default to 1 if not found

    if (activePage.length > 0) {
      const ariaLabel = activePage.attr('aria-label');
      if (ariaLabel) {
        totalPages = parseInt(ariaLabel.split(' of ')[1]); // Extract the total number from "1 of X"
      }
    }

    // If only one page exists, no need for pagination
    if (totalPages <= 1) {
      console.log(chalk.green('Only one page found, no need for further pagination.'));
      return false;
    }

    // Loop through pages until we reach the 6th page or can't find the "Next" button
    for (let currentPage = 2; currentPage <= Math.min(totalPages, 6); currentPage++) {
      try {
        const nextButtonSelector = 'li:has(a[aria-label="Next"]) a';
        const nextPageElement = await page.$(nextButtonSelector);

        if (nextPageElement) {
          const nextPageHref = await nextPageElement.evaluate(a => a.href);
          console.log(chalk.yellow(`Navigating to page ${currentPage} - URL: ${chalk.blue(nextPageHref)}`));

          // Navigate to the next page
          await page.goto(nextPageHref, { waitUntil: 'networkidle2' });

          // Wait for page to fully load before continuing
          await page.waitForSelector('div[data-at="resultlist-flex-container"]', { timeout: 60000 });

          console.log(chalk.green(`Successfully navigated to page ${currentPage}.`));
        } else {
          console.log(chalk.red(`No "Next" button found. Reached the last page.`));
          return false; // Stop further pagination when "Next" is not found
        }
      } catch (error) {
        console.error(chalk.red(`Error navigating to page ${currentPage}:`, error));
        return false; // Exit if any error occurs
      }
    }

    // After the sixth page, stop further pagination.
    console.log(chalk.blue('Scraped up to page 6, stopping pagination.'));
    return false; // Ensure pagination stops after the 6th page

  } catch (error) {
    console.error(chalk.red('Error in handlePagination:', error));
    return false; // Return false in case of failure
  }
};
