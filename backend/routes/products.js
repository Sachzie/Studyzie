const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if(isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
});

const uploadOptions = multer({ storage: storage });

const router = express.Router();

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

router.post("/", uploadOptions.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    const {
      name,
      brand,
      description,
      price,
      category,
      countInStock,
      isFeatured
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

    const product = await Product.create({
      name: name.trim(),
      brand: brand || "Studyzie Essentials",
      description,
      image: `${basePath}${fileName}`,
      price: Number(price) || 0,
      category,
      countInStock: Number(countInStock) || 0,
      isFeatured: Boolean(isFeatured)
    });

    const populated = await Product.findById(product._id).populate("category");
    return res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create product" });
  }
});

router.put("/:id", uploadOptions.single('image'), async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      price,
      category,
      countInStock,
      isFeatured
    } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category" });
      }
    }

    const product = await Product.findById(req.params.id);
    if(!product) return res.status(400).send('Invalid Product!');

    const file = req.file;
    let imagepath;

    if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`;
    } else {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined ? { name } : {}),
        ...(brand !== undefined ? { brand } : {}),
        ...(description !== undefined ? { description } : {}),
        image: imagepath,
        ...(price !== undefined ? { price: Number(price) || 0 } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(countInStock !== undefined ? { countInStock: Number(countInStock) || 0 } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {})
      },
      { new: true }
    ).populate("category");

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Failed to update product" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete product" });
  }
});

module.exports = router;