const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const uploadOptions = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isValid = Boolean(FILE_TYPE_MAP[file.mimetype]);
    if (!isValid) {
      return cb(new Error("Invalid image type"));
    }
    return cb(null, true);
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
      && process.env.CLOUDINARY_API_KEY
      && process.env.CLOUDINARY_API_SECRET
  );

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
};

const uploadImageToCloudinary = async (file) => {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set Cloudinary environment variables.");
  }

  const baseName = (file.originalname || "product-image")
    .split(".")
    .slice(0, -1)
    .join(".")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 50) || "product-image";

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    public_id: `studyzie/products/${baseName}-${Date.now()}`,
    resource_type: "image",
    overwrite: false,
  });

  return {
    imageUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.warn(`Failed to delete Cloudinary asset ${publicId}: ${error.message}`);
  }
};

router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: "Invalid product id" });
  }
});

router.post("/", uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image in the request" });
    }

    const {
      name,
      brand,
      description,
      price,
      category,
      countInStock,
      isFeatured,
    } = req.body;

    if (!name || !description || !category) {
      return res
        .status(400)
        .json({ message: "name, description, and category are required" });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const uploadedImage = await uploadImageToCloudinary(file);

    const product = await Product.create({
      name: name.trim(),
      brand: brand || "Studyzie Essentials",
      description,
      image: uploadedImage.imageUrl,
      cloudinaryPublicId: uploadedImage.publicId,
      price: Number(price) || 0,
      category,
      countInStock: Number(countInStock) || 0,
      isFeatured: parseBoolean(isFeatured, false),
    });

    const populated = await Product.findById(product._id).populate("category");
    return res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Failed to create product" });
  }
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      price,
      category,
      countInStock,
      isFeatured,
    } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category" });
      }
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(400).json({ message: "Invalid Product!" });
    }

    const file = req.file;
    let nextImage = product.image;
    let nextCloudinaryPublicId = product.cloudinaryPublicId || "";

    if (file) {
      const uploadedImage = await uploadImageToCloudinary(file);
      nextImage = uploadedImage.imageUrl;
      nextCloudinaryPublicId = uploadedImage.publicId;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined ? { name } : {}),
        ...(brand !== undefined ? { brand } : {}),
        ...(description !== undefined ? { description } : {}),
        image: nextImage,
        cloudinaryPublicId: nextCloudinaryPublicId,
        ...(price !== undefined ? { price: Number(price) || 0 } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(countInStock !== undefined ? { countInStock: Number(countInStock) || 0 } : {}),
        ...(isFeatured !== undefined ? { isFeatured: parseBoolean(isFeatured, false) } : {}),
      },
      { new: true }
    ).populate("category");

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (file && product.cloudinaryPublicId && product.cloudinaryPublicId !== nextCloudinaryPublicId) {
      await deleteImageFromCloudinary(product.cloudinaryPublicId);
    }

    return res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message || "Failed to update product" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.cloudinaryPublicId) {
      await deleteImageFromCloudinary(product.cloudinaryPublicId);
    }

    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete product" });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image size should be 10MB or less" });
    }
    return res.status(400).json({ message: "Invalid image upload request" });
  }

  if (error && error.message === "Invalid image type") {
    return res.status(400).json({ message: "Invalid image type" });
  }

  return next(error);
});

module.exports = router;
