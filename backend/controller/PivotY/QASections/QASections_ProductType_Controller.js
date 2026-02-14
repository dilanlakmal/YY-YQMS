import { QASectionsProductType } from "../../MongoDB/dbConnectionController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MULTER CONFIGURATION FOR FILE UPLOADS ---

// Define the storage directory
const uploadDir = path.join(__dirname, "../../../storage/PivotY/ProductType");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer's disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const productName = req.body.EnglishProductName.replace(/\s+/g, "_");
    const uniqueSuffix = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${productName}-${uniqueSuffix}${extension}`);
  }
});

// Create the multer upload instance
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Error: File upload only supports the following filetypes - " +
          filetypes
      )
    );
  }
});

// --- CRUD CONTROLLERS ---

export const CreateProductType = async (req, res) => {
  try {
    const { EnglishProductName, KhmerProductName, ChineseProductName } =
      req.body;

    if (!EnglishProductName) {
      return res
        .status(400)
        .json({ success: false, message: "English Product Name is required." });
    }

    // Auto-generate 'no'
    const maxNoDoc = await QASectionsProductType.findOne().sort({ no: -1 });
    const newNo = maxNoDoc ? maxNoDoc.no + 1 : 1;

    const newProductType = new QASectionsProductType({
      no: newNo,
      EnglishProductName,
      KhmerProductName: KhmerProductName || "",
      ChineseProductName: ChineseProductName || "",
      imageURL: req.file
        ? `/storage/PivotY/ProductType/${req.file.filename}`
        : ""
    });

    await newProductType.save();
    res.status(201).json({
      success: true,
      message: "Product Type created successfully.",
      data: newProductType
    });
  } catch (error) {
    // Clean up uploaded file if DB save fails
    if (req.file) fs.unlinkSync(req.file.path);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "English Product Name must be unique."
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
};

export const GetProductTypes = async (req, res) => {
  try {
    const productTypes = await QASectionsProductType.find().sort({ no: 1 });
    res.status(200).json({ success: true, data: productTypes });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
};

export const UpdateProductType = async (req, res) => {
  try {
    const { id } = req.params;
    // Read the new 'removeImage' field from the form data
    const {
      EnglishProductName,
      KhmerProductName,
      ChineseProductName,
      removeImage
    } = req.body;

    if (!EnglishProductName) {
      return res
        .status(400)
        .json({ success: false, message: "English Product Name is required." });
    }

    const productType = await QASectionsProductType.findById(id);
    if (!productType) {
      return res
        .status(404)
        .json({ success: false, message: "Product Type not found." });
    }

    let imageURL = productType.imageURL;

    // --- NEW LOGIC for handling image updates ---

    // Case 1: A new file is uploaded (replaces old or adds new)
    if (req.file) {
      if (productType.imageURL) {
        const oldImagePath = path.join(
          __dirname,
          "../../../",
          productType.imageURL.substring(1)
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageURL = `/storage/PivotY/ProductType/${req.file.filename}`;
    }
    // Case 2: No new file, but removal is requested
    else if (removeImage === "true") {
      if (productType.imageURL) {
        const oldImagePath = path.join(
          __dirname,
          "../../../",
          productType.imageURL.substring(1)
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageURL = ""; // Set the URL to empty
    }

    // Case 3 (else): No new file and no removal request, imageURL remains unchanged.

    productType.EnglishProductName = EnglishProductName;
    productType.KhmerProductName = KhmerProductName || "";
    productType.ChineseProductName = ChineseProductName || "";
    productType.imageURL = imageURL;

    const updatedProductType = await productType.save();
    res.status(200).json({
      success: true,
      message: "Product Type updated successfully.",
      data: updatedProductType
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "English Product Name must be unique."
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
};

export const DeleteProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const productType = await QASectionsProductType.findByIdAndDelete(id);

    if (!productType) {
      return res
        .status(404)
        .json({ success: false, message: "Product Type not found." });
    }

    // Delete the associated image file
    if (productType.imageURL) {
      const imagePath = path.join(
        __dirname,
        "../../../",
        productType.imageURL.substring(1)
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Product Type deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
};

// Controller to serve static images
export const GetProductImage = (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(uploadDir, filename);

    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ success: false, message: "Image not found." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
};
