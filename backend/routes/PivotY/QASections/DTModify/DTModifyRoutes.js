// routes/dtOrderRoutes.js
import express from 'express';
import {
  getDtOrderByOrderNo,
  updateDtOrder,
  getAllDtOrders,
  deleteSizeFromOrder,
  backupOrder
} from '../../../../controller/PivotY/QASections/DTModify/DTModifyController.js';

const router = express.Router();

// Include the full API path since your main server doesn't add a base path
// Get all DT orders with pagination and search
router.get('/api/dt-modify', getAllDtOrders);

// Get DT order by order number
router.get('/api/dt-modify/:orderNo', getDtOrderByOrderNo);

// Update DT order by ID
router.put('/api/dt-modify/:id', updateDtOrder);

// Delete a size from DT order
router.delete('/api/dt-modify/:id/size', deleteSizeFromOrder);

// Backup order before modification
router.post('/api/dt-modify/:id/backup', backupOrder);

export default router;
