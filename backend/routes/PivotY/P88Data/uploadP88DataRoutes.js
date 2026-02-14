import express from 'express';
import { uploadP88Data, uploadMiddleware } from '../../../controller/PivotY/P88Data/uploadP88DataController.js';

const router = express.Router();

// POST route for uploading P88 data
router.post('/api/upload-p88-data', uploadMiddleware, uploadP88Data);

export default router;