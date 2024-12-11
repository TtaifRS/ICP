import * as cheerio from 'cheerio';

export const extractIndeedJobListings = (html) => {
  const $ = cheerio.load(html);
  return $('.resultContent').map((index, element) => {
    const jobTitleElem = $(element).find('div:nth-child(1) h2.jobTitle a');
    const companyElem = $(element).find('span[data-testid="company-name"]');
    const locationElem = $(element).find('div[data-testid="text-location"]');

    return {
      title: jobTitleElem.find('span').text().trim(),
      company: companyElem.text().trim(),
      location: locationElem.text().trim(),
      datePosted: new Date(),
      link: "https://www.indeed.com" + jobTitleElem.attr('href'),
    };
  }).get();
};
