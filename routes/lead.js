import express from 'express';
import { deleteAllLeads, fetchAndSaveCloseLeads, getAllLeads } from '../controllers/leadController.js';

const router = express.Router();

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Fetch all leads from Close CRM and save them to MongoDB.
 *     tags:
 *       - Leads
 *     responses:
 *       200:
 *         description: Leads fetched and saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newLeadsCount:
 *                   type: integer
 *       500:
 *         description: Failed to fetch leads from Close CRM or an error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/leads', fetchAndSaveCloseLeads);

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Retrieve all leads from MongoDB.
 *     tags:
 *       - Leads
 *     responses:
 *       200:
 *         description: All leads fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       name:
 *                         type: string
 *                       closeId:
 *                         type: string
 *       500:
 *         description: Failed to retrieve leads or an error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/leads', getAllLeads);

/**
 * @swagger
 * /leads:
 *   delete:
 *     summary: Delete all leads from MongoDB.
 *     tags:
 *       - Leads
 *     responses:
 *       200:
 *         description: All leads deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       500:
 *         description: Failed to delete leads or an error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.delete('/leads', deleteAllLeads);

export default router;
