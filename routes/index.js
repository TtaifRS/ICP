import express from 'express'
import { postScrapers, testFunction, testServer } from '../controllers/index.js'

const router = express.Router()

router.post('/leads/all-functions', postScrapers)
router.get('/server/test', testServer)
router.get('/test', testFunction)


export default router

