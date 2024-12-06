import express from 'express'
import { scrapeWebsiteData } from '../controllers/websiteScraperController.js'
import { filterWebsiteLeads } from '../middlewares/filterLeads.js'

const router = express.Router()

router.post('/leads/website-scraper', filterWebsiteLeads, scrapeWebsiteData)

export default router