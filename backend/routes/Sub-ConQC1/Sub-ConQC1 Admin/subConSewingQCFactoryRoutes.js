import express from 'express';
import {
  getSubConSewingFactory,
  saveSubConSewingFactory,
  updateSubConSewingFactory,
  deleteSubConSewingFactory,

  getAllSubConQCList,
  addSpecificSubConQCList,
  updateSpecificSubConQCList,
  deleteSpecificSubConQCList,

} from '../../../controller/Sub-ConQC1/Sub-ConQC1 Admin/SubConSewingQCFactoryController.js';

const router = express.Router();

// --- FACTORY MANAGEMENT ---
router.get('/api/subcon-sewing-factories-manage', getSubConSewingFactory);
router.post('/api/subcon-sewing-factories-manage', saveSubConSewingFactory);
router.put('/api/subcon-sewing-factories-manage/:id', updateSubConSewingFactory);
router.delete('/api/subcon-sewing-factories-manage/:id', deleteSubConSewingFactory);

// --- QC LIST MANAGEMENT IN SUB CON---
router.get('/api/subcon-sewing-factories-manage/qcs/all', getAllSubConQCList);
router.post('/api/subcon-sewing-factories-manage/:factoryId/qcs', addSpecificSubConQCList);
router.put('/api/subcon-sewing-factories-manage/qcs/:qcMongoId', updateSpecificSubConQCList);
router.delete('/api/subcon-sewing-factories-manage/qcs/:qcMongoId', deleteSpecificSubConQCList);



export default router;