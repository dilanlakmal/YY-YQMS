import express from "express";
import {
  CreateTemplate,
  GetTemplates,
  UpdateTemplate,
  DeleteTemplate,
  GetCategoriesForSelection,
  GetPhotoSectionsForSelection,
  ReorderTemplates
} from "../../../controller/PivotY/QATemplates/QATemplatesReport_Controller.js";

const router = express.Router();

router.post("/api/qa-sections-templates", CreateTemplate);
router.get("/api/qa-sections-templates", GetTemplates);
router.put("/api/qa-sections-templates/:id", UpdateTemplate);
router.delete("/api/qa-sections-templates/:id", DeleteTemplate);

//Reorder templates
router.put("/api/qa-sections-templates-reorder", ReorderTemplates);

// Helper to populate the modal
router.get("/api/qa-sections-templates/categories", GetCategoriesForSelection);

// Helper to populate the modal (Photo Sections)
router.get(
  "/api/qa-sections-templates/photo-sections",
  GetPhotoSectionsForSelection
);

export default router;
