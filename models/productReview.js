import mongoose from "mongoose"


const reviewSchema  = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
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
        },
      ],
    rating: { type: Number, required: true , min: 1 , max: 5},
    image: { type: String },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
} , { timestamps: true });

const ProductReview  = mongoose.model("ProductReview ", reviewSchema);

export default ProductReview;