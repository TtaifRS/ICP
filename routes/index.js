import express from 'express'
import { postScrapper, testFunction } from '../controllers/index.js'

const router = express.Router()

router.post('/leads', postScrapper)
router.get('/test', testFunction)


export default router

