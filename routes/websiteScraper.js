/**
 * @swagger
 * tags:
 *   name: Leads Website Details
 *   description: API for managing leads and scraping website data.
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     SocialMediaLinks:
 *       type: object
 *       properties:
 *         facebook:
 *           type: string
 *         instagram:
 *           type: string
 *         youtube:
 *           type: string
 *         xing:
 *           type: string
 *         linkedin:
 *           type: string
 *         twitter:
 *           type: string
 *         pinterest:
 *           type: string
 *         SEOInfo:
 *           type: object
 *           properties:
 *             titleTag:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 content:
 *                   type: string
 *                 isValidLength:
 *                   type: boolean
 *                 description:
 *                   type: string
 *             metaDescription:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 content:
 *                   type: string
 *                 isValidLength:
 *                   type: boolean
 *                 description:
 *                   type: string
 *             headerTags:
 *               type: object
 *               properties:
 *                 isValidSequence:
 *                   type: boolean
 *                 multipleH1:
 *                   type: boolean
 *                 description:
 *                   type: string
 *             imageAltText:
 *               type: object
 *               properties:
 *                 totalImages:
 *                   type: number
 *                 totalMissingAlt:
 *                   type: number
 *                 altMissing:
 *                   type: boolean
 *                 description:
 *                   type: string
 *             schemaMarkup:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 description:
 *                   type: string
 *             robotsMetaTag:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 description:
 *                   type: string
 *             hreflangTags:
 *               type: object
 *               properties:
 *                 countries:
 *                   type: array
 *                   items:
 *                     type: string
 *                 description:
 *                   type: string
 *             openGraphTags:
 *               type: object
 *               properties:
 *                 missingTags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 description:
 *                   type: string
 *             canonicalTag:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 href:
 *                   type: string
 *                 description:
 *                   type: string
 *             favicon:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 href:
 *                   type: string
 *                 description:
 *                   type: string
 *             viewportMetaTag:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 content:
 *                   type: string
 *                 description:
 *                   type: string
 *             brokenLinks:
 *               type: object
 *               properties:
 *                 brokenLinkCount:
 *                   type: number
 *                 description:
 *                   type: string
 *             textToHtmlRatio:
 *               type: object
 *               properties:
 *                 ratio:
 *                   type: string
 *                 isWithinBestPractices:
 *                   type: boolean
 *                 description:
 *                   type: string
 *             missingOrEmptyLinks:
 *               type: object
 *               properties:
 *                 missingLinkCount:
 *                   type: number
 *                 description:
 *                   type: string
 *             commonLibraryFiles:
 *               type: object
 *               properties:
 *                 detectedLibraries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       library:
 *                         type: string
 *                       count:
 *                         type: number
 *                       files:
 *                         type: array
 *                         items:
 *                           type: string
 *                 description:
 *                   type: string
 *     ImprintDetails:
 *       type: object
 *       properties:
 *         emails:
 *           type: array
 *           items:
 *             type: string
 *         phones:
 *           type: array
 *           items:
 *             type: string
 *         jobTitlesWithNames:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               jobTitle:
 *                 type: string
 *               name:
 *                 type: string
 *     Lead:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         url:
 *           type: string
 *         socialMediaLinks:
 *           $ref: '#/components/schemas/SocialMediaLinks'
 *         imprintDetails:
 *           $ref: '#/components/schemas/ImprintDetails'
 *         seoInfo:
 *           $ref: '#/components/schemas/SEOInfo'
 */

import express from 'express'
import { getLeadsWithWebsiteData, scrapeWebsiteData, updateWebsiteDetailsForLead } from '../controllers/websiteScraperController.js'


const router = express.Router()

router.put('/leads/all/update-website-details', scrapeWebsiteData)
router.put('/leads/:id/update-website-details', updateWebsiteDetailsForLead);
router.get('/leads/with-website-data', getLeadsWithWebsiteData);



export default router