/**
 * @swagger
 * components:
 *   schemas:
 *     JobLead:
 *       type: object
 *       required:
 *         - companyName
 *         - source
 *       properties:
 *         companyName:
 *           type: string
 *           description: The name of the company offering the job(s).
 *         location:
 *           type: string
 *           description: The location of the company or job, if available.
 *         companyURL:
 *           type: string
 *           format: uri
 *           description: The URL of the company's official website, if available.
 *         updatedCloseCRM:
 *           type: string
 *           format: date-time
 *           description: The last date this lead was updated in Close CRM.
 *         processed:
 *            type: boolean
 *            description: True or false value depending on the google map search
 *        
 *         jobs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               jobTitle:
 *                 type: string
 *                 description: The title of the job (e.g., 'Software Engineer').
 *               jobLink:
 *                 type: string
 *                 format: uri
 *                 description: The link to the job posting.
 *               jobDate:
 *                 type: string
 *                 format: date-time
 *                 description: The date when the job was posted, if available.
 *               jobSource: 
 *                  type: string
 *                  description: Indeed or Stepstone
 *       example:
 *         companyName: "TechCorp"
 *         location: "Berlin, Germany"
 *         url: "https://techcorp.example.com"
 *         updatedCloseCRM: "2024-12-10T12:00:00Z"
 *         
 *         jobs:
 *           - jobTitle: "Software Engineer"
 *             jobLink: "https://example.com/job/software-engineer"
 *             jobDate: "2024-12-01T00:00:00Z"
 *             source: "indeed"
 */



import express from 'express'
import { deleteAllLeadsAndProgress, getJobLeads, scrapeAndSaveIndeedLeads, scrapeAndSaveStepstonesLeads, updateCompanyUrlswithGoogleMap } from '../controllers/jobController.js'

const router = express.Router()

/**
 * @swagger
 * /leads/scrape-indeed:
 *   post:
 *     summary: Scrape job leads from Indeed and save them to MongoDB.
 *     description: Launches a scraping process to gather job leads from Indeed using Puppeteer and saves the results in the MongoDB database.
 *     tags:
 *       - Job Leads
 *     responses:
 *       200:
 *         description: Successfully scraped and saved job leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job leads successfully scraped and saved to MongoDB.
 *       500:
 *         description: Failed to scrape job leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred.
 *                 error:
 *                   type: string
 *                   example: Error message details.
 */

router.post('/leads/scrape-indeed', scrapeAndSaveIndeedLeads)


/**
 * @swagger
 * /leads/scrape-stepstone:
 *   post:
 *     summary: Scrape job leads from StepStone and save them to MongoDB.
 *     description: Launches a scraping process to gather job leads from StepStone using Puppeteer and saves the results in the MongoDB database.
 *     tags:
 *       - Job Leads
 *     responses:
 *       200:
 *         description: Successfully scraped and saved job leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job leads successfully scraped and saved to MongoDB.
 *       500:
 *         description: Failed to scrape job leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected error occurred.
 *                 error:
 *                   type: string
 *                   example: Error message details.
 */

router.post('/leads/scrape-stepstone', scrapeAndSaveStepstonesLeads)


/**
 * @swagger
 * /leads/jobs:
 *   get:
 *     summary: Retrieve all job leads.
 *     description: Fetches all the job leads from the database, including total count and lead details.
 *     tags:
 *       - Job Leads
 *     responses:
 *       200:
 *         description: Successfully retrieved job leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeads:
 *                   type: number
 *                   example: 50
 *                 leads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       companyName:
 *                         type: string
 *                         example: Example Company
 *                       location:
 *                         type: string
 *                         example: Berlin, Germany
 *                       companyUrl:
 *                         type: string
 *                         example: https://www.example.com
 *                       processed: 
 *                         type: boolean
 *                         example: true
 *                       jobs:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             jobTitle:
 *                               type: string
 *                               example: Frontend Developer
 *                             jobLink:
 *                               type: string
 *                               example: https://example.com/job
 *                             jobDate:
 *                               type: string
 *                               format: date
 *                               example: 2024-12-10
 *       500:
 *         description: Failed to fetch job leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch leads.
 *                 error:
 *                   type: string
 *                   example: Error message details.
 */
router.get('/leads/jobs', getJobLeads)


/**
 * @swagger
 * /leads/google-map:
 *   put:
 *     summary: Update company URLs using Google Maps scraping.
 *     description: Updates the companyURL field for job leads by scraping website URLs from Google Maps based on company name and location.
 *     tags:
 *       - Job Leads
 *     responses:
 *       200:
 *         description: Successfully updated company URLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Process completed. Successfully updated 15 records. 5 errors occurred.
 *                 successCount:
 *                   type: number
 *                   example: 15
 *                 errorCount:
 *                   type: number
 *                   example: 5
 *       500:
 *         description: An error occurred while updating company URLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error details.
 */

router.put('/leads/google-map', updateCompanyUrlswithGoogleMap)


/**
 * @swagger
 * /leads/job/leads-and-progress:
 *   delete:
 *     summary: Delete all job leads and progress entries.
 *     description: Removes all job lead records from the database along with all progress entries.
 *     tags:
 *       - Job Leads
 *     responses:
 *       200:
 *         description: Successfully deleted all job leads and progress entries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully deleted all leads and progress entries.
 *                 deletedLeads:
 *                   type: number
 *                   example: 50
 *                 deletedProgressEntries:
 *                   type: number
 *                   example: 20
 *       500:
 *         description: An error occurred while deleting leads and progress entries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to delete leads and progress.
 *                 error:
 *                   type: string
 *                   example: Internal server error details.
 */


router.delete('/leads/job/leads-and-progress', deleteAllLeadsAndProgress);

export default router