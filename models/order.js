import mongoose from "mongoose"


const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
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

const Order  = mongoose.model("Order ", orderSchema);

export default Order;