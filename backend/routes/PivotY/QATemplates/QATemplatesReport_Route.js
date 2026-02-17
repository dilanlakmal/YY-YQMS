import express from "express";
import {
  CreateTemplate,
  GetTemplates,
  UpdateTemplate,
  DeleteTemplate,
  GetCategoriesForSelection,
  GetPhotoSectionsForSelection,
  ReorderTemplates,
  BulkSyncTemplateDetails,
} from "../../../controller/PivotY/QATemplates/QATemplatesReport_Controller.js";

const router = express.Router();

//Reorder templates
router.put("/api/qa-sections-templates-reorder", ReorderTemplates);

// Bulk Sync Chinese Names (New Route)
router.put("/api/qa-sections-templates/bulk-sync", BulkSyncTemplateDetails);

// Helper to populate the modal
router.get("/api/qa-sections-templates/categories", GetCategoriesForSelection);

// Helper to populate the modal (Photo Sections)
router.get(
  "/api/qa-sections-templates/photo-sections",
  GetPhotoSectionsForSelection,
);

// Generic CRUD routes
router.post("/api/qa-sections-templates", CreateTemplate);
router.get("/api/qa-sections-templates", GetTemplates);
router.put("/api/qa-sections-templates/:id", UpdateTemplate);
router.delete("/api/qa-sections-templates/:id", DeleteTemplate);

export default router;
