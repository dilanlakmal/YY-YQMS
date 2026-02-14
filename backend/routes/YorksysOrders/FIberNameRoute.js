import express from "express";
import {
  createFiber,
  getAllFibers,
  updateFiber,
  deleteFiber
} from "../../controller/YorksysOrders/FiberNameController.js";

const router = express.Router();

router.post("/api/humidity/fiber/create", createFiber);
router.get("/api/humidity/fiber/get-all", getAllFibers);
router.put("/api/humidity/fiber/update/:id", updateFiber);
router.delete("/api/humidity/fiber/delete/:id", deleteFiber);

export default router;
