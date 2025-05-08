import mongoose from "mongoose";

const saleDiscountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  SalesCategory: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountPrice: {
    type: Number,
    required: true,
  },
  inStock: {
    type: Number,
    required: true,
  },
  offerTitle: {
    type: String,
    required: false,
    trim: true,
  },
  offerDescription: {
    type: String,
    required: false,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SaleDiscountProduct = mongoose.model(
  "SaleDiscountProduct",
  saleDiscountSchema
);

export default SaleDiscountProduct;
