/**
 * @swagger
 * tags:
 *   name: Leads LinkedIn Scraping
 *   description: API for managing leads and scraping linkedin data.
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     LinkedinData:
 *       type: object
 *       properties:
 *         companyName:
 *           type: string
 *         industry:
 *           type: string
 *         size:
 *           type: string
 *         headquarters:
 *           type: string
 *         organizationType:
 *           type: string
 *         foundedOn:
 *           type: string
 *         employees:
 *           $ref: '#/components/schemas/Employee'
 * 
 *     Employee:
 *       type: object
 *       properties:
 *          name:
 *            type: string
 *          position: 
 *            type: string
 * 
 *     Lead:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         url:
 *           type: string
 *         linkedinData:
 *           $ref: '#/components/schemas/LinkedinData'
 */


import express from 'express'
import { scrapeLinkedInController } from '../controllers/linkedInScraperController.js'

const router = express.Router()

router.put('/leads/all/update-linkedin-details', scrapeLinkedInController)

export default router