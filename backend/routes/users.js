const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

  const baseName = (file.originalname || "user-image")
    .split(".")
    .slice(0, -1)
    .join(".")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 50) || "user-image";

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    public_id: `studyzie/users/${baseName}-${Date.now()}`,
    resource_type: "image",
    overwrite: false,
  });

  return {
    imageUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

// GET all users
router.get('/', async (req, res) => {
  try {
    const userList = await User.find().select('-passwordHash');

    if (!userList) {
      return res.status(500).json({ success: false });
    }
    res.send(userList);
  } catch (error) {
    return res.status(500).json({ success: false, error: error });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'The user with the given ID was not found.' });
    }
    res.status(200).send(user);
  } catch (error) {
    return res.status(500).json({ success: false, error: error });
  }
});

// POST register user
router.post('/', uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    let imageUrl, cloudinaryPublicId;

    if (file) {
        const uploadedImage = await uploadImageToCloudinary(file);
        imageUrl = uploadedImage.imageUrl;
        cloudinaryPublicId = uploadedImage.publicId;
    }

    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: parseBoolean(req.body.isAdmin, false),
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
      image: imageUrl,
      cloudinaryPublicId: cloudinaryPublicId,
    });
    user = await user.save();

    if (!user) return res.status(400).send('the user cannot be created!');

    res.send(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    return res.status(500).json({ success: false, error: error });
  }
});

// POST register user (alternative endpoint)
router.post('/register', uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    let imageUrl, cloudinaryPublicId;

    if (file) {
        const uploadedImage = await uploadImageToCloudinary(file);
        imageUrl = uploadedImage.imageUrl;
        cloudinaryPublicId = uploadedImage.publicId;
    }

    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: parseBoolean(req.body.isAdmin, false),
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
      image: imageUrl,
      cloudinaryPublicId: cloudinaryPublicId,
    });
    user = await user.save();

    if (!user) return res.status(400).send('the user cannot be created!');

    res.send(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    return res.status(500).json({ success: false, error: error });
  }
});


// PUT update user
router.put('/:id', uploadOptions.single("image"), async (req, res) => {
  try {
    const userExist = await User.findById(req.params.id);
    let newPassword
    if (req.body.password) {
      newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
      newPassword = userExist.passwordHash;
    }

    const file = req.file;
    let imageUrl, cloudinaryPublicId;

    if (file) {
        const uploadedImage = await uploadImageToCloudinary(file);
        imageUrl = uploadedImage.imageUrl;
        cloudinaryPublicId = uploadedImage.publicId;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        passwordHash: newPassword,
        phone: req.body.phone,
        isAdmin: parseBoolean(req.body.isAdmin, userExist?.isAdmin || false),
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
        image: imageUrl,
        cloudinaryPublicId: cloudinaryPublicId,
      },
      { new: true }
    );

    if (!user) return res.status(400).send('the user cannot be created!');

    res.send(user);
  } catch (error) {
    return res.status(500).json({ success: false, error: error });
  }
});

// GET user cart
router.get('/:id/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'cart.product',
      model: 'Product' // Ensure this matches your Product model name
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Transform the cart to match frontend expectations
    // The frontend expects a flat object with product properties + quantity
    const cartItems = user.cart.map(item => {
      if (!item.product) return null; // Handle case where product was deleted
      return {
        ...item.product._doc,
        product: item.product._id, // Store product ID in 'product' field for consistency
        quantity: item.quantity,
        id: item.product.id // Ensure id is available
      };
    }).filter(item => item !== null);

    res.send(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({ success: false, error: error });
  }
});

// PUT update user cart
router.put('/:id/cart', async (req, res) => {
  try {
    const { cart } = req.body;
    
    // Validate cart items format
    const formattedCart = cart.map(item => ({
      product: item.product || item.id || item._id, // Handle different ID locations
      quantity: item.quantity
    }));

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { cart: formattedCart },
      { new: true }
    ).populate({
        path: 'cart.product',
        model: 'Product'
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return the updated cart in the format frontend expects
    const cartItems = user.cart.map(item => {
        if (!item.product) return null;
        return {
          ...item.product._doc,
          product: item.product._id,
          quantity: item.quantity,
          id: item.product.id
        };
      }).filter(item => item !== null);

    res.send(cartItems);
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ success: false, error: error });
  }
});

// POST login user
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.JWT_SECRET;

    if (!user) {
      return res.status(400).json({ success: false, message: 'The user was not found' });
    }

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured. Set JWT_SECRET.'
      });
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin,
        },
        secret,
        { expiresIn: '1d' }
      );

      res.status(200).send({ user: user.email, token: token, userId: user.id, isAdmin: user.isAdmin });
    } else {
      res.status(400).json({ success: false, message: 'Password is wrong' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

// DELETE user
router.delete('/:id', (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res.status(200).json({ success: true, message: 'the user is deleted!' });
      } else {
        return res.status(404).json({ success: false, message: 'user not found!' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// GET user count
router.get('/get/count', async (req, res) => {
  try {
    const userCount = await User.countDocuments((count) => count);

    if (!userCount) {
      res.status(500).json({ success: false });
    }
    res.send({
      userCount: userCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error });
  }
});

module.exports = router;
