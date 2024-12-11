/**
 * @swagger
 * /lead/all-functions:
 *   post:
 *     summary: Scrapes and processes detailed data for a single lead based on the provided company URL.
 *     description: This endpoint initiates the scraping of a company's details, such as social media links, Google ad transparency, PageSpeed data, Google ranking information, and more. The scraped data is stored in the database for further processing.
 *     tags:
 *       - Lead
 *     parameters:
 *       - in: body
 *         name: leadData
 *         description: Company data to be scraped for detailed information.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             companyName:
 *               type: string
 *               example: "Tech Innovators"
 *             companyUrl:
 *               type: string
 *               example: "https://www.techinnovators.com"
 *     responses:
 *       200:
 *         description: Successfully scraped and stored the data for the lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lead data scraped and stored successfully."
 *       400:
 *         description: Bad request. Missing company name or URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Company name and URL are required."
 *       500:
 *         description: Internal server error. Failed to scrape and store the data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to scrape the provided company URL."
 *       502:
 *         description: Bad Gateway. Error during external scraping operations.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error scraping external data sources."
 *     security:
 *       - BearerAuth: []
 */

import express from 'express'
import { postScrapers, postSingleLead, testFunction, testServer } from '../controllers/index.js'

const router = express.Router()

router.post('/leads/all-functions', postScrapers)
router.get('/server/test', testServer)
router.get('/test', testFunction)

router.post('/lead/all-functions', postSingleLead)

export default router

