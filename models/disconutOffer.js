import mongoose from "mongoose";

const saleDiscountSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  originalPrice: {
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

const SaleDiscount = mongoose.model("SaleDiscount", saleDiscountSchema);
export default SaleDiscount;
