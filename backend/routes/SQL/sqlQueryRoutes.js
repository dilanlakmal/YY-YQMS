import express from "express";
import { syncDtOrders } from "../../controller/SQL/sqlQueryController.js";

const router = express.Router();

router.get("/api/sync-dt-orders", syncDtOrders);

export default router;
