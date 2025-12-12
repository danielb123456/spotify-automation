import express from 'express';
import { syncUserData, getUserData } from '../controllers/dataController.js';

const router = express.Router();

router.post('/sync', syncUserData);
router.get('/:userId', getUserData);

export default router;