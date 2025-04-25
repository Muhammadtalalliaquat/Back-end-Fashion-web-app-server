import express from "express";
import sendResponse from "../helpers/Response.js";
import SaleDiscountProduct from "../models/disconutOffer.js";
import SaleDiscountOrder from "../models/SaleDiscountOrder.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";

const router = express.Router();

router.post("/placeSaleDiscountOrder", autheUser, async (req, res) => {
  try {
    const { productId, country, city, area } = req.body;

    const product = await SaleDiscountProduct.findById(productId);
    if (!product) {
      return sendResponse(
        res,
        404,
        null,
        true,
        "Discounted product not found."
      );
    }

    const quantity = 1;
    const totalPrice = product.discountPrice * quantity;

    const newOrder = new SaleDiscountOrder({
      userId: req.user._id,
      productId: product._id,
      quantity,
      totalPrice,
      price: product.discountPrice,
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
    const filter = req.user.isAdmin ? {} : { userId: req.user._id };
    const salesOrders = await SaleDiscountOrder.find(filter)
      .populate("userId", "userName email isAdmin")
      .populate("productId", "name image discountPrice")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, salesOrders, false, "All sales orders retrieved");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});


router.put("/updateDiscountOrder/:orderId", autheUser, isAdminCheck, async (req, res) => {
    const { status } = req.body;
    const { orderId } = req.params;

    try {
      const validStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return sendResponse(res, 400, null, true, "Invalid status");
      }

      const order = await SaleDiscountOrder.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      
      if (!order) return sendResponse(res, 404, null, true, "Order not found");

      if (status === "delivered") {
        await SaleDiscountOrder.findByIdAndDelete(orderId);
        return sendResponse(
          res,
          200,
          null,
          false,
          "Discount Order delivered and removed from database"
        );
      }
      sendResponse(res, 200, order, false, "Discount Order status updated");
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);


export default router;