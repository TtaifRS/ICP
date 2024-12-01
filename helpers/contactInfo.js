import nlp from 'compromise';
import validator from 'validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Helper to extract emails from anchor tags
export const extractEmailsFromAnchors = ($, emailPattern) => {
  const emails = new Set();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (emailPattern.test(href)) {
      const extractedEmail = href.match(emailPattern)?.[1];
      if (validator.isEmail(extractedEmail)) {
        emails.add(extractedEmail);
      }
    }
  });

  return emails;
};

// Helper to extract phone numbers from anchor tags
export const extractPhonesFromAnchors = ($, phonePattern) => {
  const phones = new Set();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (phonePattern.test(href)) {
      const extractedPhone = href.match(phonePattern)?.[1];
      if (typeof extractedPhone === 'string') {
        const parsedPhone = parsePhoneNumberFromString(extractedPhone);
        if (parsedPhone && parsedPhone.isValid()) {
          phones.add(parsedPhone.number);
        }
      }
    }
  });

  return phones;
};

// Helper to extract job titles and names
export const extractJobTitlesAndNames = (textContent, jobTitles) => {
  const jobTitlesWithNames = [];


  const cleanText = textContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Step 2: Process each job title
  jobTitles.forEach((title) => {
    const regex = new RegExp(
      `(${title}):?\\s+([\\w.,\\s-]+?(?=(?:Tel:|Fax:|E-mail:|VAT ID|Register court|Management|\\n|$)))`,
      'gi'
    );
    const matches = cleanText.matchAll(regex);

    for (const match of matches) {
      const rawText = match[0];
      const potentialNames = match[2]?.trim();


      const doc = nlp(rawText);
      const extractedNames = doc.people().out('array');

      if (extractedNames.length > 0) {

        extractedNames.forEach((name) => {
          jobTitlesWithNames.push({ name: name.trim(), title });
        });
      } else if (potentialNames) {

        jobTitlesWithNames.push({ name: potentialNames, title });
      }
    }
  });


  return jobTitlesWithNames;
};

// Helper to extract emails and phones from the full HTML
export const extractFromFullHtml = (html) => {
  const emails = new Set();
  const phones = new Set();

  const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emailMatches) {
    emailMatches.forEach((email) => {
      if (validator.isEmail(email)) {
        emails.add(email);
      }
    });
  }

  const phoneMatches = html.match(/[\d\s()+-]+/g);
  if (phoneMatches) {
    phoneMatches.forEach((phone) => {
      if (typeof phone === 'string') {
        const parsedPhone = parsePhoneNumberFromString(phone);
        if (parsedPhone && parsedPhone.isValid()) {
          phones.add(parsedPhone.number);
        }
      }
    });
  }

  return { emails, phones };
};


