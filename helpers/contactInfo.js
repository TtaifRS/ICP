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
  const words = textContent.split(/\s+/); // Split the text into words
  const results = [];
  const seen = new Set(); // Track unique jobTitle-name pairs

  // Helper function to extract names and titles in structured lists
  const extractStructuredNames = (text, jobTitle) => {
    const regex = new RegExp(`${jobTitle}:\\s*([^,]+(?:,\\s*[^,]+)*)`, 'i'); // Match "JobTitle: name1, name2, ..."
    const match = text.match(regex);
    if (match) {
      const names = match[1].split(',').map(name => name.trim());
      names.forEach((fullName) => {
        const cleanedName = fullName.replace(/\(.*?\)/g, '').trim(); // Remove parentheses and extra text
        const nameDoc = nlp(cleanedName);
        const peopleNames = nameDoc.people().out('array'); // Extract cleaned names
        if (peopleNames.length > 0) {
          const name = peopleNames[0];
          if (name.split(' ').length >= 2) { // Ensure the name has at least two words
            const key = `${jobTitle}|${name}`;
            if (!seen.has(key)) {
              results.push({ jobTitle, name });
              seen.add(key); // Deduplicate
            }
          }
        }
      });
    }
  };

  // Check for structured data first
  for (const jobTitle of jobTitles) {
    extractStructuredNames(textContent, jobTitle);
  }

  // Continue with existing logic for unstructured data
  for (let i = 0; i < words.length; i++) {
    for (const jobTitle of jobTitles) {
      if (words[i].toLowerCase().includes(jobTitle.toLowerCase())) {
        // Job title match found
        const potentialName = words.slice(i + 1, i + 11).join(' '); // Check the next 10 words
        const nameDoc = nlp(potentialName.replace(/\(.*?\)/g, '').trim());
        const peopleNames = nameDoc.people().out('array'); // Extract names using NLP

        if (peopleNames.length > 0) {
          const name = peopleNames[0];
          if (name.split(' ').length >= 2) { // Ensure the name has at least two words
            const key = `${jobTitle}|${name}`;
            if (!seen.has(key)) {
              results.push({ jobTitle, name });
              seen.add(key);
            }
          }
          i += name.split(' ').length; // Skip over the detected name words
          break; // Move to the next word after a match
        }
      }
    }
  }

  return results;
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


