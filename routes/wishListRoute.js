import express from "express";
import ProductWishList from "../models/wishList.js";
import sendResponse from "../helpers/Response.js";
import { autheUser } from "../middleware/authUser.js";
import SaleDiscountProduct from "../models/disconutOffer.js";

const router = express.Router();

router.post("/addWishList", autheUser, async (req, res) => {
  const { productId } = req.body;

  try {
    let wishList = await ProductWishList.findOne({ userId: req.user._id });

    if (!wishList) {
      wishList = new ProductWishList({ userId: req.user._id, products: [] });
    }

    const alreadyExists = wishList.products.find(
      (p) => p.productId.toString() === productId
    );

    if (alreadyExists) {
      return sendResponse(res, 201, null, true, "Product already in wishlist");
    }

    const isSaleProduct = await SaleDiscountProduct.findById(productId);
    const productModel = isSaleProduct ? "SaleDiscountProduct" : "Product";

    wishList.products.push({ productId, productModel });

    await wishList.save();

    const updatedWishList = await ProductWishList.findById(
      wishList._id
    ).populate("products.productId");

    sendResponse(res, 200, updatedWishList, false, "Product added to wishlist success");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});


router.get("/getWishList", autheUser, async (req, res) => {
  try {
    const wishList = await ProductWishList.findOne({
      userId: req.user._id,
    }).populate("products.productId");

     if (!wishList) {
       wishList = new ProductWishList({ userId: req.user._id, products: [] });
     }

    sendResponse(res, 200, wishList, false, "fetch product to wishlist");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});


router.delete("/remove/:productId", autheUser, async (req, res) => {
  try {
    const wishList = await ProductWishList.findOne({ userId: req.user.id });
    if (!wishList) return sendResponse(res, 404, null, true, "Wishlist not found");

    wishList.products = wishList.products.filter(
      (p) => p.productId.toString() !== req.params.productId
    );
    await wishList.save();

    const updatedCart = await ProductWishList.findById(wishList._id).populate(
      "products.productId"
    );

    sendResponse(res, 200, updatedCart, false , "Product removed from wishlist");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});


export default router;
