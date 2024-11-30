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

  jobTitles.forEach((title) => {
    const titleIndex = textContent.indexOf(title);
    if (titleIndex !== -1) {
      const before = textContent.slice(Math.max(0, titleIndex - 500), titleIndex);
      const after = textContent.slice(titleIndex, titleIndex + 500);
      const surroundingText = `${before} ${after}`;

      const names = nlp(surroundingText).people().out('array');
      names.forEach((name) => {
        jobTitlesWithNames.push({ name, title });
      });
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


