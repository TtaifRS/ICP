import express from 'express'
import { postScrapers, testFunction, testRender } from '../controllers/index.js'

const router = express.Router()

router.post('/leads', postScrapers)
router.get('/render/test', testRender)
router.get('/test', testFunction)


export default router

