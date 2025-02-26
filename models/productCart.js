// import { required } from "joi"
import mongoose from "mongoose"


const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, default: 1 },
        }
    ]
})

const ProductCart = mongoose.model("ProductCart", cartSchema);

export default ProductCart;