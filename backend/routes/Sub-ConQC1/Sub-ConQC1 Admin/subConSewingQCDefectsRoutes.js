import express from 'express';
import {
  getAllDefects,
  saveSubConSewingDefect,
  updateSubConSewingDefect,
  deleteSubConSewingDefect,
} from '../../../controller/Sub-ConQC1/Sub-ConQC1 Admin/SubConSewingQCDefectsController.js';

const router = express.Router();

router.get('/api/subcon-defects-manage', getAllDefects);
router.post('/api/subcon-defects', saveSubConSewingDefect);
router.put('/api/subcon-defects/:id', updateSubConSewingDefect);
router.delete('/api/subcon-defects-manage/:id', deleteSubConSewingDefect);

export default router;