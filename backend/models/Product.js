const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      default: "Studyzie Essentials",
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ""
    },
    imageKey: {
      type: String,
      default: "",
      trim: true
    },
    cloudinaryPublicId: {
      type: String,
      default: "",
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    countInStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

productSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
