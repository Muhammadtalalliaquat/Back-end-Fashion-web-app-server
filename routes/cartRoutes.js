import express from "express";
import ProductCart from "../models/productCart.js";
import sendResponse from "../helpers/Response.js";
import { autheUser } from "../middleware/authUser.js";

const router = express.Router();

router.get("/getCart", autheUser, async (req, res) => {
  try {
    const cart = await ProductCart.findOne({ userId: req.user._id }).populate(
      "products.productId"
    );

    if (!cart || !cart.products || cart.products.length === 0)
      return sendResponse(res, 200, { products: [] }, false, "Cart is empty");

    sendResponse(res, 200, cart, false, "Cart fetched successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.post("/addCart", autheUser, async (req, res) => {
  const { productId, quantity } = req.body;
  // console.log("Request User:", req.user);
  // console.log("Request Body:", req.body);
  try {
    let cart = await ProductCart.findOne({ userId: req.user._id });

    if (!cart || !cart.products || cart.length === 0) {
      cart = new ProductCart({ userId: req.user._id, products: [] });
    }

    const existingProduct = cart.products.find(
      (p) => p.productId.toString() === productId
    );

    if (existingProduct) {
      existingProduct.quantity += quantity || 1;
    } else {
      cart.products.push({ productId, quantity });
    }

    await cart.save();

    // **Populate product details before sending response**
    const updatedCart = await ProductCart.findById(cart._id).populate(
      "products.productId"
    );

    sendResponse(res, 200, updatedCart, false, "Product added to cart");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.delete("/remove/:productId", autheUser, async (req, res) => {
  try {
    const cart = await ProductCart.findOne({ userId: req.user.id });
    if (!cart) return sendResponse(res, 404, null, true, "Cart not found");

    cart.products = cart.products.filter(
      (p) => p.productId.toString() !== req.params.productId
    );
    await cart.save();

    const updatedCart = await ProductCart.findById(cart._id).populate(
      "products.productId"
    );

    sendResponse(res, 200, updatedCart, "Product removed from cart");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.put("/update/:productId", autheUser, async (req, res) => {
  const { quantity } = req.body;
  try {
    
    const cart = await ProductCart.findOne({ userId: req.user.id });

    if (!cart) return sendResponse(res, 404, null, true, "cart not found");

    console.log("Cart before update:", cart);
    console.log("Product ID from request:", req.params.productId);
    
    // const product = cart.products.find(
    //   (p) => p.productId !== req.params.productId
    // );

    const product = cart.products.find(
      (p) => p.productId.toString() === req.params.productId
    );

    if (!product)
      return sendResponse(res, 404, null, true, "Product not in cart");

    product.quantity = quantity;

    await cart.save();

    const updatedCart = await ProductCart.findById(cart._id).populate(
      "products.productId"
    );

    sendResponse(res, 200, updatedCart, false, "Cart updated");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
