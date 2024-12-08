import express from 'express'
import { scrapeTestWebsiteData, scrapeWebsiteData } from '../controllers/websiteScraperController.js'


const router = express.Router()

router.put('/leads/website-scraper', scrapeWebsiteData)
router.put('/leads/website-scraper/test', scrapeTestWebsiteData)

export default router