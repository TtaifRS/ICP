import express from 'express'

import { scrapeFacebookData } from '../controllers/facebookScraperController.js'

const router = express.Router()

router.post('/leads/facebook-scraper', scrapeFacebookData)

export default router