const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

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
router.post('/', async (req, res) => {
  try {
    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
      image: req.body.image,
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
router.post('/register', async (req, res) => {
  try {
    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
      image: req.body.image,
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
router.put('/:id', async (req, res) => {
  try {
    const userExist = await User.findById(req.params.id);
    let newPassword
    if (req.body.password) {
      newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
      newPassword = userExist.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        passwordHash: newPassword,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
        image: req.body.image,
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
      return res.status(400).send('The user not found');
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
      res.status(400).send('password is wrong');
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error });
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
