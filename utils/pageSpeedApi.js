import axios from 'axios';

/**
 * Fetches PageSpeed Insights data for a given URL and strategy.
 * @param {string} url - The website URL to analyze.
 * @param {string} strategy - Analysis strategy: "mobile" or "desktop".
 * @returns {Promise<object>} - PageSpeed Insights metrics.
 */
export const fetchPageSpeedData = async (url, strategy) => {
  const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;
  const API_URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;

  try {
    const response = await axios.get(API_URL, {
      params: {
        url,
        strategy,
        key: API_KEY,
      },
    });

    const { lighthouseResult } = response.data;

    if (!lighthouseResult) {
      throw new Error('No data available for the provided URL.');
    }

    const metrics = {
      performanceScore: lighthouseResult.categories.performance.score * 100, // Score as percentage
      firstContentfulPaint: lighthouseResult.audits['first-contentful-paint'].displayValue,
      speedIndex: lighthouseResult.audits['speed-index'].displayValue,
      timeToInteractive: lighthouseResult.audits['interactive'].displayValue,
      mobileFriendly: strategy === 'mobile'
        ? (lighthouseResult.audits['viewport'].score === 1 ? 'Yes' : 'No')
        : 'N/A',
    };

    // Convert display values (e.g., "2.2 s") to numerical values for comparison
    const fcp = parseFloat(metrics.firstContentfulPaint.replace('s', ''));
    const speedIndex = parseFloat(metrics.speedIndex.replace('s', ''));
    const tti = parseFloat(metrics.timeToInteractive.replace('s', ''));

    let performanceDescription = '';

    // Check FCP
    if (fcp <= 2.2) {
      performanceDescription += `FCP is within the limit (2.2 seconds). Measured: ${fcp} seconds. `;
    } else {
      performanceDescription += `FCP exceeds the limit (2.2 seconds). Measured: ${fcp} seconds. `;
    }

    // Check Speed Index
    if (speedIndex <= 3.4) {
      performanceDescription += `Speed Index is within the limit (3.4 seconds). Measured: ${speedIndex} seconds. `;
    } else {
      performanceDescription += `Speed Index exceeds the limit (3.4 seconds). Measured: ${speedIndex} seconds. `;
    }

    // Check TTI
    if (tti <= 7.3) {
      performanceDescription += `TTI is within the limit (7.3 seconds). Measured: ${tti} seconds.`;
    } else {
      performanceDescription += `TTI exceeds the limit (7.3 seconds). Measured: ${tti} seconds.`;
    }

    // Attach the description to the metrics object
    metrics.performanceDescription = performanceDescription;

    return { success: true, metrics };
  } catch (error) {
    console.error(`Error fetching PageSpeed data (${strategy}):`, error.message);
    console.error(error)

    // Handle errors from PageSpeed API gracefully
    if (error.response) {
      const { status, data } = error.response;
      if (status === 400 && data.error) {
        return { success: false, message: `PageSpeed API returned an error for the URL: ${data.error.message}` };
      } else if (status === 500 || status === 503) {
        return { success: false, message: `PageSpeed API is currently unavailable. Please try again later.` };
      }
    }

    return { success: false, message: `Unable to fetch PageSpeed data for the URL: ${url}. Error: ${error.message}` };
  }
};

