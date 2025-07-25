import mongoose from "mongoose"


const wishListSchema = new mongoose.Schema(
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
          enum: ["Product", "SaleDiscountProduct"],
        },
      },
    ],
  },
  { timestamps: true }
);

const ProductWishList = mongoose.model("ProductWishList", wishListSchema);
export default ProductWishList;
