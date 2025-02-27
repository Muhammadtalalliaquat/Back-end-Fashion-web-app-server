import express from "express";
import sendResponse from "../helpers/Response.js";
import ProductCart from "../models/productCart.js";
import Order from "../models/order.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";

const router = express.Router();

router.post("/placeOrder", autheUser, async (req, res) => {
  try {
    const orderItem = await ProductCart.findOne({ userId: req.user._id }).populate(
      "products.productId"
    );

    console.log("Order Items:", orderItem.products);

    if (!orderItem) {
      return sendResponse(
        res,
        400,
        null,
        true,
        "Cart is empty or does not exist."
      );
    }
    if (!orderItem.products || orderItem.products.length === 0) {
      return sendResponse(res, 400, null, true, "Cart is empty.");
    }

    let totalPrice = orderItem.products.reduce((sum, p) => {
      return sum + p.productId.price * p.quantity;
    }, 0);

    let newOrder = new Order({
      userId: req.user._id,
      products: orderItem.products.map((p) => ({
        productId: p.productId?._id || p.productId,
        quantity: p.quantity,
      })),
      totalPrice,
      status: "pending"
    });

    await newOrder.save();
    await ProductCart.findOneAndDelete({ userId: req.user._id });

    sendResponse(res, 201, newOrder, false, "Order placed successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/allOrders", autheUser, isAdminCheck, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "userName email")
      .populate("products.productId");
    sendResponse(res, 200, orders, false, "All orders retrieved");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.put("/updateOrder/:orderId", autheUser, isAdminCheck, async (req, res) => {
    const { status } = req.body;
    const { orderId } = req.params;

    try {
      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return sendResponse(res, 400, null, true, "Invalid status");
      }
      
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      if (!order) return sendResponse(res, 404, null, true, "Order not found");

      sendResponse(res, 200, order, false, "Order status updated");
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

export default router;
