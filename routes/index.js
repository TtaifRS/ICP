import express from 'express'
import { postScrapers, testFunction } from '../controllers/index.js'

const router = express.Router()

router.post('/leads', postScrapers)
router.get('/test', testFunction)


export default router

