import express from 'express'
import { deleteAllLeads, fetchAndSaveCloseLeads, getAllLeads } from '../controllers/leadController.js'

const router = express.Router()

router.post('/leads', fetchAndSaveCloseLeads)
router.get('/leads', getAllLeads)
router.delete('/leads', deleteAllLeads)


export default router