const express = require("express");
const Promotion = require("../models/Promotion");

const router = express.Router();

const normalizeCode = (code) => (code || "").toString().trim().toUpperCase();

const serializePromotion = (promotion) => ({
  id: promotion.id,
  title: promotion.title || "Special Promotion",
  message: promotion.message || "",
  discountCode: promotion.discountCode,
  discountAmount: promotion.discountAmount,
  startsAt: promotion.startsAt,
  endsAt: promotion.endsAt,
});

router.get("/active", async (req, res) => {
  try {
    const promotion = await Promotion.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!promotion) {
      return res.json({ active: false });
    }

    if (promotion.endsAt && promotion.endsAt < new Date()) {
      promotion.isActive = false;
      await promotion.save();
      return res.json({ active: false });
    }

    return res.json({ active: true, promotion: serializePromotion(promotion) });
  } catch (error) {
    return res.status(500).json({ active: false, message: error.message });
  }
});

router.get("/validate", async (req, res) => {
  try {
    const code = normalizeCode(req.query.code);
    if (!code) {
      return res.status(400).json({ valid: false, message: "Promo code is required." });
    }

    const promotion = await Promotion.findOne({
      isActive: true,
      discountCode: code,
    }).sort({ createdAt: -1 });

    if (!promotion) {
      return res.json({ valid: false, message: "Promo code is invalid or expired." });
    }

    if (promotion.endsAt && promotion.endsAt < new Date()) {
      promotion.isActive = false;
      await promotion.save();
      return res.json({ valid: false, message: "Promo code has expired." });
    }

    return res.json({
      valid: true,
      promotion: serializePromotion(promotion),
    });
  } catch (error) {
    return res.status(500).json({ valid: false, message: error.message });
  }
});

module.exports = router;
