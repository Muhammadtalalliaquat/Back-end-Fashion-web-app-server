import express from "express";
import sendResponse from "../helpers/Response.js";
import SaleDiscount from "../models/disconutOffer.js";
import SaleDiscountOrder from "../models/SaleDiscountOrder.js";
import { autheUser } from "../middleware/authUser.js";

const router = express.Router();

router.post("/placeSaleDiscountOrder", autheUser, async (req, res) => {
  try {
    const { productId, country, city, area } = req.body;

    const product = await SaleDiscount.findById(productId);
    if (!product) {
      return sendResponse(
        res,
        404,
        null,
        true,
        "Discounted product not found."
      );
    }

    // const quantity = 1;
    // const totalPrice = product.discountPrice * quantity;

    const newOrder = new SaleDiscountOrder({
      userId: req.user._id,
      productId: product._id,
    //   quantity,
    //   totalPrice,
      price,
      address: { country, city, area },
    });

    await newOrder.save();

    return sendResponse(
      res,
      201,
      { order: newOrder },
      false,
      "Sale discount order placed successfully."
    );
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, null, true, "Something went wrong.");
  }
});


router.get("/getSalesOrders", autheUser, async (req, res) => {
  try {
    const salesOrders = await SaleDiscountOrder.find({ userId: req.user._id })
      .populate("userId", "userName email isAdmin")
      .populate("productId", "name image discountPrice")
      .sort({ createdAt: -1 })

    sendResponse(res, 200, salesOrders, false, "All sales orders retrieved");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});


export default router;