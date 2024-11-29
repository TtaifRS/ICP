// Individual Checks

export const checkTitleTag = ($) => {
  const title = $('title').text();
  return title
    ? {
      exists: true,
      content: title,
      isValidLength: title.length >= 40 && title.length <= 60,
      description:
        'The title tag is important for SEO as it helps search engines understand the content of the page. Ideal length is between 40 and 60 characters.',
    }
    : {
      exists: false,
      description: 'The title tag is missing, which can negatively impact SEO as search engines rely on it to understand page content.',
    };
};

export const checkMetaDescription = ($) => {
  const metaDescription = $('meta[name="description"]').attr('content');
  return metaDescription
    ? {
      exists: true,
      content: metaDescription,
      isValidLength: metaDescription.length >= 140 && metaDescription.length <= 160,
      description:
        'Meta description provides a summary of the page for search engines and users. Ideal length is between 140 and 160 characters.',
    }
    : {
      exists: false,
      description:
        'The meta description is missing. This may result in search engines using arbitrary text from your page, which could impact click-through rates.',
    };
};


export const checkHeaderTags = ($) => {
  let lastHeaderLevel = 0;
  let headersValid = true;
  let h1Count = 0;

  for (let i = 1; i <= 6; i++) {
    $(`h${i}`).each(() => {
      if (i === 1) h1Count++;
      if (i > lastHeaderLevel + 1) {
        headersValid = false;
      }
      lastHeaderLevel = i;
    });
  }

  return {
    isValidSequence: headersValid,
    multipleH1: h1Count > 1,
    description: 'Header tags (H1-H6) should follow a proper hierarchy. Ensure only one H1 is present for optimal SEO.',
  };
};

export const checkImageAltText = ($) => {
  const totalImages = $('img').length;
  const imagesMissingAlt = [];
  $('img').each((_, element) => {
    const alt = $(element).attr('alt');
    if (!alt) {
      imagesMissingAlt.push({
        src: $(element).attr('src') || null,
        alt: 'Missing',
      });
    }
  });

  return {
    total: totalImages,
    missingAlt: imagesMissingAlt.length,
    imagesMissingAlt,
    description:
      'Images should have alt attributes for better accessibility and SEO. Missing alt tags may affect search rankings.',
  };
};

export const checkSchemaMarkup = ($) => ({
  exists: $('script[type="application/ld+json"]').length > 0,
  description:
    'Schema markup helps search engines understand the content and context of your page. It’s crucial for improving visibility in search results.',
});

export const checkRobotsMetaTag = ($) => {
  const robotsMeta = $('meta[name="robots"]').attr('content');
  return robotsMeta
    ? {
      exists: true,
      content: robotsMeta,
      description:
        'The robots meta tag is important for controlling how search engines index and follow links on your site.',
    }
    : {
      exists: false,
      description:
        'The robots meta tag is important for controlling how search engines index and follow links on your site.'
    };
};

export const checkHreflangTags = ($) => {
  const countries = new Set();

  $('link[rel="alternate"][hreflang]').each((_, element) => {
    const hreflang = $(element).attr('hreflang');
    if (hreflang) {
      const country = hreflang.split('-')[1]?.toUpperCase(); // Extract country code
      if (country) {
        countries.add(country);
      }
    }
  });

  return {
    countries: Array.from(countries),
    description: countries.size
      ? `Hreflang tags indicate your content targets these countries: ${Array.from(countries).join(', ')}.`
      : 'No hreflang tags found. Adding hreflang tags can help search engines serve the correct regional version of your content.',
  };
};


export const checkOpenGraphTags = ($) => {
  const requiredTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:site_name'];
  const missingTags = [];

  requiredTags.forEach((tag) => {
    if (!$(`meta[property="${tag}"]`).attr('content')) {
      missingTags.push(tag);
    }
  });

  return {
    missingTags,
    description: missingTags.length
      ? `The following Open Graph tags are missing: ${missingTags.join(', ')}. These tags enhance how your content appears when shared on social media.`
      : 'All required Open Graph tags are present, ensuring optimal appearance on social media.',
  };
};


export const checkCanonicalTag = ($) => {
  const canonicalTag = $('link[rel="canonical"]').attr('href');
  return canonicalTag
    ? {
      exists: true,
      href: canonicalTag,
      description:
        'The canonical tag helps prevent duplicate content issues by specifying the preferred version of a page.',
    }
    : { exists: false };
};

export const checkFavicon = ($) => {
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
  return favicon
    ? { exists: true, href: favicon, description: 'A favicon improves branding and user experience.' }
    : { exists: false, escription: 'A favicon improves branding and user experience.' };
};

export const checkViewportMetaTag = ($) => {
  const viewport = $('meta[name="viewport"]').attr('content');
  return viewport
    ? { exists: true, content: viewport, description: 'The viewport meta tag ensures proper rendering on mobile devices.' }
    : { exists: false };
};

export const checkBrokenLinks = ($) => {
  let brokenLinkCount = 0;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript')) {
      brokenLinkCount++;
    }
  });

  return {
    brokenLinkCount,
    description: brokenLinkCount > 0
      ? `Found ${brokenLinkCount} broken link(s). Broken links can negatively impact user experience and search engine rankings by signaling poor website maintenance.`
      : 'No broken links detected. This ensures a smooth user experience and helps maintain search engine trust.',
  };
};


export const calculateTextToHtmlRatio = (html, $) => {
  const text = $('body').text();
  const textLength = text.replace(/\s+/g, '').length;
  const htmlLength = html.length;
  const ratio = (textLength / htmlLength) * 100;

  return {
    ratio: ratio.toFixed(2), // Limit to two decimal places
    isWithinBestPractices: ratio >= 25 && ratio <= 70,
    description:
      ratio >= 25 && ratio <= 70
        ? 'The text-to-HTML ratio is within the recommended range (25% to 70%), ensuring a good balance for SEO and readability.'
        : 'The text-to-HTML ratio is outside the recommended range (25% to 70%). Low ratios may indicate excessive code, while high ratios could signal insufficient HTML structure.',
  };
};


export const checkMissingOrEmptyLinks = ($) => {
  let missingLinkCount = 0;

  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (!href || href.trim() === '') {
      missingLinkCount++;
    }
  });

  return {
    missingLinkCount,
    description: missingLinkCount > 0
      ? `Found ${missingLinkCount} missing or empty link(s). Missing links can frustrate users, hurt SEO rankings, and signal poor site quality. Ensure all links are functional and have valid href attributes.`
      : 'No missing or empty links detected. This ensures good user experience and helps maintain strong SEO rankings.',
  };
};

export const checkCommonLibraryFiles = ($) => {
  const commonLibraries = ['jquery', 'bootstrap', 'react', 'angular', 'vue', 'tailwindcss', 'swiper', 'socket.io'];
  const detectedLibraries = {};

  // Initialize counts for all libraries
  commonLibraries.forEach((lib) => {
    detectedLibraries[lib] = [];
  });

  // Check for libraries in script and link tags
  $('script, link').each((_, element) => {
    const src = $(element).attr('src') || $(element).attr('href');
    if (src) {
      commonLibraries.forEach((lib) => {
        if (new RegExp(lib, 'i').test(src)) {
          detectedLibraries[lib].push(src);
        }
      });
    }
  });

  // Count detected libraries
  const librarySummary = Object.entries(detectedLibraries)
    .filter(([_, files]) => files.length > 0)
    .map(([lib, files]) => ({ library: lib, count: files.length, files }));

  return {
    detectedLibraries: librarySummary,
    description: librarySummary.length
      ? `Detected ${librarySummary.length} common library/libraries. Using these libraries can improve development efficiency but ensure they are up-to-date for optimal performance and security.`
      : 'No common libraries detected. Ensure you are using necessary libraries for your project needs.',
  };
};


export const checkHttpHeaders = ($) => {
  const headers = {
    xPoweredBy: {
      value: $('meta[http-equiv="X-Powered-By"]').attr('content') || null,
      description: 'This header exposes server technology (e.g., Express, PHP). It is recommended to remove or mask this header to reduce security risks.',
    },
    contentSecurityPolicy: {
      value: $('meta[http-equiv="Content-Security-Policy"]').attr('content') || null,
      description: 'Content-Security-Policy (CSP) helps prevent cross-site scripting (XSS) and other attacks by specifying the resources the browser is allowed to load.',
    },
    xFrameOptions: {
      value: $('meta[http-equiv="X-Frame-Options"]').attr('content') || null,
      description: 'This header protects against clickjacking by controlling whether your site can be embedded in iframes. Recommended values are "DENY" or "SAMEORIGIN".',
    },
    xContentTypeOptions: {
      value: $('meta[http-equiv="X-Content-Type-Options"]').attr('content') || null,
      description: 'The "nosniff" directive ensures that browsers respect declared content types and prevents MIME type sniffing attacks.',
    },
    strictTransportSecurity: {
      value: $('meta[http-equiv="Strict-Transport-Security"]').attr('content') || null,
      description: 'Strict-Transport-Security (HSTS) enforces HTTPS connections to your site, enhancing security and SEO. Recommended max-age is at least 31536000 (1 year).',
    },
  };

  return {
    headers,
    overallDescription:
      'HTTP headers are crucial for web security, performance, and SEO. Ensuring that these headers are properly configured can prevent vulnerabilities and improve user trust.',
  };
};

export const checkWebStack = ($) => {
  const stacks = [];

  // Check for WordPress by looking for 'wp-content' in the script or link sources
  if ($("script[src*='wp-content']").length > 0 || $("link[href*='wp-content']").length > 0) {
    stacks.push('WordPress');
  }

  // Check for Shopify by looking for 'cdn.shopify.com' in the script sources
  if ($("script[src*='cdn.shopify.com']").length > 0 || $("link[href*='cdn.shopify.com']").length > 0) {
    stacks.push('Shopify');
  }

  // Check for React by looking for 'react.js' or a div with id="root"
  if ($("script[src*='react']").length > 0 || $("div[id='root']").length > 0) {
    stacks.push('React');
  }

  // Check for Angular by looking for 'angular' in script sources
  if ($("script[src*='angular']").length > 0) {
    stacks.push('Angular');
  }

  // Check for Vue.js by looking for 'vue' in script sources
  if ($("script[src*='vue']").length > 0) {
    stacks.push('Vue.js');
  }

  // Check for Joomla by looking for 'joomla' in script sources
  if ($("script[src*='joomla']").length > 0 || $("link[href*='joomla']").length > 0) {
    stacks.push('Joomla');
  }

  // Check for Magento by looking for 'magento' in the path of scripts
  if ($("script[src*='magento']").length > 0 || $("link[href*='magento']").length > 0) {
    stacks.push('Magento');
  }

  // Check for Wix by looking for 'wix.com' in the script sources
  if ($("script[src*='wix.com']").length > 0) {
    stacks.push('Wix');
  }

  // Check for Squarespace by looking for 'squarespace' in the script or link sources
  if ($("script[src*='squarespace']").length > 0 || $("link[href*='squarespace']").length > 0) {
    stacks.push('Squarespace');
  }

  // Check for ASP.NET by looking for 'aspnet' in script sources
  if ($("script[src*='aspnet']").length > 0) {
    stacks.push('ASP.NET');
  }

  // Check for Node.js (Express.js) by looking for 'express' in the script sources
  if ($("script[src*='express']").length > 0) {
    stacks.push('Node.js');
  }

  // Check for Laravel by looking for 'laravel' in script or link sources
  if ($("script[src*='laravel']").length > 0 || $("link[href*='laravel']").length > 0) {
    stacks.push('Laravel');
  }

  // Check for Firebase by looking for 'firebase' in the script sources
  if ($("script[src*='firebase']").length > 0) {
    stacks.push('Firebase');
  }

  // Check for Next.js by looking for '__NEXT_DATA__' or '_next' in the URLs
  if ($("script[type='application/json']").html()?.includes('__NEXT_DATA__') || $("script[src*='_next']").length > 0) {
    stacks.push('Next.js');
  }

  return {
    stacks,
    description: `The detected web stack(s) are identified based on common JavaScript libraries, file paths, and unique HTML structures that are specific to certain CMS or frameworks.`
  };
};
