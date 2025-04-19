// models/SaleDiscountOrder.js
import mongoose from "mongoose";


const saleDiscountOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SaleDiscount",
    required: true,
  },
  quantity: { type: Number, default: 1 },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  address: {
    country: String,
    city: String,
    area: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const SaleDiscountOrder = mongoose.model("SaleDiscountOrder", saleDiscountOrderSchema);
export default SaleDiscountOrder;

