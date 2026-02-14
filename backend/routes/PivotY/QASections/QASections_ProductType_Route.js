import express from "express";
import {
  upload, // Import multer middleware
  CreateProductType,
  GetProductTypes,
  UpdateProductType,
  DeleteProductType,
  GetProductImage
} from "../../../controller/PivotY/QASections/QASections_ProductType_Controller.js";

const router = express.Router();

// CREATE: upload.single('image') processes a single file from the 'image' field
router.post(
  "/api/qa-sections-product-type",
  upload.single("image"),
  CreateProductType
);

// READ
router.get("/api/qa-sections-product-type", GetProductTypes);

// UPDATE: upload.single('image') also used here to handle optional new image uploads
router.put(
  "/api/qa-sections-product-type/:id",
  upload.single("image"),
  UpdateProductType
);

// DELETE
router.delete("/api/qa-sections-product-type/:id", DeleteProductType);

// NEW ROUTE: To serve the static image files
router.get("/api/qa-sections-product-type/image/:filename", GetProductImage);

export default router;
