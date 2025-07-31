// import { required } from "joi"
import mongoose from "mongoose"


const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "products.productModel", // ← dynamic ref
        },
        productModel: {
          type: String,
          required: true,
          enum: ["Product", "SaleDiscountProduct"], // ← supported models
        },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

const ProductCart = mongoose.model("ProductCart", cartSchema);

export default ProductCart;