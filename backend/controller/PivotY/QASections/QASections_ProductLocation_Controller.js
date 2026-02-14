import {
  QASectionsProductLocation,
  QASectionsProductType,
  DtOrder,
} from "../../MongoDB/dbConnectionController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(
  __dirname,
  "../../../storage/PivotY/ProductLocations",
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const productTypeName = req.body.productTypeName || "unknown";
    const viewType = file.fieldname; // 'frontView' or 'backView'

    // Clean product name for filename
    const cleanName = productTypeName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${cleanName}_${viewType}_${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

/* ============================================================
   CREATE - Product Location with Images
   ============================================================ */

/**
 * POST /api/qa-sections-product-location
 * Creates a new product location configuration with images
 */
export const CreateProductLocation = async (req, res) => {
  try {
    const { productTypeId, productTypeName, frontLocations, backLocations } =
      req.body;

    // Validate required fields
    if (!productTypeId || !productTypeName) {
      return res.status(400).json({
        success: false,
        message: "productTypeId and productTypeName are required",
      });
    }

    // Validate that images were uploaded
    if (!req.files || !req.files.frontView || !req.files.backView) {
      return res.status(400).json({
        success: false,
        message: "Both front and back view images are required",
      });
    }

    // Verify product type exists
    const productType = await QASectionsProductType.findById(productTypeId);
    if (!productType) {
      // Delete uploaded files
      if (req.files.frontView) fs.unlinkSync(req.files.frontView[0].path);
      if (req.files.backView) fs.unlinkSync(req.files.backView[0].path);

      return res.status(404).json({
        success: false,
        message: "Product type not found",
      });
    }

    // Parse location data
    const parsedFrontLocations = frontLocations
      ? JSON.parse(frontLocations)
      : [];
    const parsedBackLocations = backLocations ? JSON.parse(backLocations) : [];

    // Create relative paths for storage
    const frontImagePath = `/storage/PivotY/ProductLocations/${req.files.frontView[0].filename}`;
    const backImagePath = `/storage/PivotY/ProductLocations/${req.files.backView[0].filename}`;

    const newProductLocation = new QASectionsProductLocation({
      productTypeId,
      productTypeName,
      style: "Common", // Default for general configs
      frontView: {
        imagePath: frontImagePath,
        locations: parsedFrontLocations,
      },
      backView: {
        imagePath: backImagePath,
        locations: parsedBackLocations,
      },
    });

    await newProductLocation.save();

    return res.status(201).json({
      success: true,
      message: "Product location created successfully",
      data: newProductLocation,
    });
  } catch (error) {
    console.error("Error creating product location:", error);

    // Clean up uploaded files on error
    if (req.files) {
      if (req.files.frontView) {
        fs.unlinkSync(req.files.frontView[0].path).catch(() => {});
      }
      if (req.files.backView) {
        fs.unlinkSync(req.files.backView[0].path).catch(() => {});
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create product location",
      error: error.message,
    });
  }
};

/* ============================================================
   READ - Get All Product Locations
   ============================================================ */

/**
 * GET /api/qa-sections-product-location
 * Retrieves all product locations
 */
export const GetProductLocations = async (req, res) => {
  try {
    const productLocations = await QASectionsProductLocation.find({
      style: "Common", // Only fetch standard configs for the main list
    })
      .populate(
        "productTypeId",
        "EnglishProductName KhmerProductName ChineseProductName",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: productLocations.length,
      data: productLocations,
    });
  } catch (error) {
    console.error("Error fetching product locations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product locations",
      error: error.message,
    });
  }
};

/* ============================================================
   READ - Get Specific Product Location
   ============================================================ */

/**
 * GET /api/qa-sections-product-location/:id
 * Retrieves a specific product location by ID
 */
export const GetSpecificProductLocation = async (req, res) => {
  try {
    const productLocation = await QASectionsProductLocation.findById(
      req.params.id,
    ).populate(
      "productTypeId",
      "EnglishProductName KhmerProductName ChineseProductName",
    );

    if (!productLocation) {
      return res.status(404).json({
        success: false,
        message: "Product location not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: productLocation,
    });
  } catch (error) {
    console.error("Error fetching product location:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product location",
      error: error.message,
    });
  }
};

/* ============================================================
   READ - Get Product Location by Product Type
   ============================================================ */

/**
 * GET /api/qa-sections-product-location/product-type/:productTypeId
 * Retrieves product location by product type ID
 */
export const GetProductLocationByType = async (req, res) => {
  try {
    const productLocation = await QASectionsProductLocation.findOne({
      productTypeId: req.params.productTypeId,
      style: "Common",
      isActive: true,
    }).populate(
      "productTypeId",
      "EnglishProductName KhmerProductName ChineseProductName",
    );

    if (!productLocation) {
      return res.status(404).json({
        success: false,
        message: "No location configuration found for this product type",
      });
    }

    return res.status(200).json({
      success: true,
      data: productLocation,
    });
  } catch (error) {
    console.error("Error fetching product location by type:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product location",
      error: error.message,
    });
  }
};

/* ============================================================
   UPDATE - Product Location
   ============================================================ */

/**
 * PUT /api/qa-sections-product-location/:id
 * Updates a product location configuration
 */
export const UpdateProductLocation = async (req, res) => {
  try {
    const { frontLocations, backLocations } = req.body;

    const productLocation = await QASectionsProductLocation.findById(
      req.params.id,
    );

    if (!productLocation) {
      // Clean up uploaded files if any
      if (req.files) {
        if (req.files.frontView) fs.unlinkSync(req.files.frontView[0].path);
        if (req.files.backView) fs.unlinkSync(req.files.backView[0].path);
      }

      return res.status(404).json({
        success: false,
        message: "Product location not found",
      });
    }

    // Update front view if new image is uploaded
    if (req.files && req.files.frontView) {
      // Delete old image
      const oldFrontPath = path.join(
        __dirname,
        "../../..",
        productLocation.frontView.imagePath,
      );
      if (fs.existsSync(oldFrontPath)) {
        fs.unlinkSync(oldFrontPath);
      }

      productLocation.frontView.imagePath = `/storage/PivotY/ProductLocations/${req.files.frontView[0].filename}`;
    }

    // Update back view if new image is uploaded
    if (req.files && req.files.backView) {
      // Delete old image
      const oldBackPath = path.join(
        __dirname,
        "../../..",
        productLocation.backView.imagePath,
      );
      if (fs.existsSync(oldBackPath)) {
        fs.unlinkSync(oldBackPath);
      }

      productLocation.backView.imagePath = `/storage/PivotY/ProductLocations/${req.files.backView[0].filename}`;
    }

    // Update locations if provided
    if (frontLocations) {
      productLocation.frontView.locations = JSON.parse(frontLocations);
    }

    if (backLocations) {
      productLocation.backView.locations = JSON.parse(backLocations);
    }

    await productLocation.save();

    return res.status(200).json({
      success: true,
      message: "Product location updated successfully",
      data: productLocation,
    });
  } catch (error) {
    console.error("Error updating product location:", error);

    // Clean up uploaded files on error
    if (req.files) {
      if (req.files.frontView) fs.unlinkSync(req.files.frontView[0].path);
      if (req.files.backView) fs.unlinkSync(req.files.backView[0].path);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update product location",
      error: error.message,
    });
  }
};

/* ============================================================
   DELETE - Product Location
   ============================================================ */

/**
 * DELETE /api/qa-sections-product-location/:id
 * Deletes a product location configuration
 */
export const DeleteProductLocation = async (req, res) => {
  try {
    const productLocation = await QASectionsProductLocation.findById(
      req.params.id,
    );

    if (!productLocation) {
      return res.status(404).json({
        success: false,
        message: "Product location not found",
      });
    }

    // Delete associated images
    const frontPath = path.join(
      __dirname,
      "../../..",
      productLocation.frontView.imagePath,
    );
    const backPath = path.join(
      __dirname,
      "../../..",
      productLocation.backView.imagePath,
    );

    if (fs.existsSync(frontPath)) {
      fs.unlinkSync(frontPath);
    }

    if (fs.existsSync(backPath)) {
      fs.unlinkSync(backPath);
    }

    await QASectionsProductLocation.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product location deleted successfully",
      data: productLocation,
    });
  } catch (error) {
    console.error("Error deleting product location:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product location",
      error: error.message,
    });
  }
};

/* ============================================================
   SERVE - Image Files
   ============================================================ */

/**
 * GET /api/qa-sections-product-location/image/:filename
 * Serves product location images
 */
export const ServeProductLocationImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(uploadDir, filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error serving image:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to serve image",
      error: error.message,
    });
  }
};

/* ============================================================
   STYLE SPECIFIC LOGIC (NEW)
   ============================================================ */

/**
 * GET /api/orders/search
 * Search for orders in DtOrder Collection (dt_orders)
 */
export const SearchOrders = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(term, "i");

    // Search using Mongoose Model DtOrder
    const orders = await DtOrder.find({
      $or: [{ Order_No: { $regex: regex } }, { CustStyle: { $regex: regex } }],
    })
      .select("Order_No CustStyle EngName") // Select necessary fields
      .limit(10)
      .lean();

    // Map DB fields to Frontend expected fields
    const formattedOrders = orders.map((o) => ({
      _id: o._id,
      order_number: o.Order_No, // Map Order_No -> order_number
      style_name: o.CustStyle, // Map CustStyle -> style_name
      buyer_name: o.EngName,
    }));

    return res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Error searching orders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/qa-sections-product-location/style/:style/type/:productTypeId
 * Get location config for a specific style (fallback to Common)
 */
export const GetStyleLocationConfig = async (req, res) => {
  try {
    const { style, productTypeId } = req.params;

    // 1. Try to find exact match for this Style/Order
    let config = await QASectionsProductLocation.findOne({
      style: style,
      productTypeId: productTypeId,
    }).populate("productTypeId");

    let isInherited = false;

    // 2. If not found, find the "Common" template
    if (!config) {
      config = await QASectionsProductLocation.findOne({
        style: "Common",
        productTypeId: productTypeId,
      }).populate("productTypeId");
      isInherited = true;
    }

    if (!config) {
      return res.status(404).json({
        success: false,
        message:
          "No configuration found (neither Style specific nor Common template).",
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
      isInherited: isInherited,
    });
  } catch (error) {
    console.error("Error fetching style config:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/qa-sections-product-location/style
 * Save or Update a Style-specific configuration
 */
export const SaveStyleLocationConfig = async (req, res) => {
  try {
    const {
      style,
      productTypeId,
      productTypeName,
      frontLocations,
      backLocations,
      existingFrontPath,
      existingBackPath,
    } = req.body;

    // ... (Validation checks remain the same) ...

    let locationConfig = await QASectionsProductLocation.findOne({
      style: style,
      productTypeId: productTypeId,
    });

    // Prepare Image Paths (Same logic)
    let frontImagePath = existingFrontPath;
    let backImagePath = existingBackPath;

    if (req.files && req.files.frontView) {
      frontImagePath = `/storage/PivotY/ProductLocations/${req.files.frontView[0].filename}`;
    }
    if (req.files && req.files.backView) {
      backImagePath = `/storage/PivotY/ProductLocations/${req.files.backView[0].filename}`;
    }

    // Parse locations
    const parsedFrontLocs = frontLocations ? JSON.parse(frontLocations) : [];
    const parsedBackLocs = backLocations ? JSON.parse(backLocations) : [];

    if (locationConfig) {
      // UPDATE EXISTING
      // We update fields individually so Mongoose preserves _id of existing sub-documents
      locationConfig.frontView.imagePath = frontImagePath;
      locationConfig.frontView.locations = parsedFrontLocs;

      locationConfig.backView.imagePath = backImagePath;
      locationConfig.backView.locations = parsedBackLocs;

      await locationConfig.save();
    } else {
      // CREATE NEW (Logic remains the same)
      locationConfig = new QASectionsProductLocation({
        productTypeId,
        productTypeName,
        style,
        frontView: { imagePath: frontImagePath, locations: parsedFrontLocs },
        backView: { imagePath: backImagePath, locations: parsedBackLocs },
        isActive: true,
      });
      await locationConfig.save();
    }

    return res.status(200).json({
      success: true,
      message: "Style configuration saved successfully",
      data: locationConfig,
    });
  } catch (error) {
    // ... (Error handling remains the same) ...
    console.error("Error saving style config:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* 
   ADD THIS NEW FUNCTION 
   Get All Style Specific Locations (Excluding "Common") 
*/
export const GetAllStyleLocations = async (req, res) => {
  try {
    // 1. Get Query Params (defaults: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // 2. Build Query
    // We always exclude "Common". If search exists, we regex match the 'style' field
    const query = {
      style: { $ne: "Common" },
    };

    if (search) {
      query.style = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // 3. Execute Query (Parallel: Get Data + Get Total Count)
    const [data, totalCount] = await Promise.all([
      QASectionsProductLocation.find(query)
        .populate("productTypeId", "EnglishProductName")
        .sort({ updatedAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(), // lean() for better performance
      QASectionsProductLocation.countDocuments(query),
    ]);

    // 4. Calculate Total Pages
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: data,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching style list:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
