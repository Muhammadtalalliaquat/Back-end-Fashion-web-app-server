import mongoose from "mongoose";

const saleDiscountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountPrice: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SaleDiscountProduct = mongoose.model("SaleDiscountProduct", saleDiscountSchema);
export default SaleDiscountProduct;
