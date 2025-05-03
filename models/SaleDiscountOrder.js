// models/SaleDiscountOrder.js
import mongoose from "mongoose";


const saleDiscountOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SaleDiscountProduct",
    required: true,
  },
  quantity: { type: Number, default: 1 },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  posterCode: { type: Number, required: true },
  phone: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const SaleDiscountOrder = mongoose.model("SaleDiscountOrder", saleDiscountOrderSchema);
export default SaleDiscountOrder;

