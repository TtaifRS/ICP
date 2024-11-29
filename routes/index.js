import express from 'express'
import { postScrapper } from '../controllers/index.js'

const router = express.Router()

router.post('/leads', postScrapper)


export default router

