import express from "express";
import sendResponse from "../helpers/Response.js";
import ProductCart from "../models/productCart.js";
// import Product from "../models/products.js";
import Order from "../models/order.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";

const router = express.Router();

router.post("/placeOrder", autheUser, async (req, res) => {
  try {
    const { productId, country, city, area, quantity } = req.body;

    const orderItem = await ProductCart.findOne({
      userId: req.user._id,
    }).populate("products.productId");

    if (!orderItem || !orderItem.products || orderItem.products.length === 0) {
      return sendResponse(
        res,
        400,
        null,
        true,
        "Cart is empty or does not exist."
      );
    }
    // console.log("Order Items:", orderItem.products);

    let selectedProducts;

    if (productId) {
      selectedProducts = orderItem.products.filter(
        (p) => String(p.productId._id) === String(productId)
      );
      if (selectedProducts.length === 0) {
        return sendResponse(res, 404, null, true, "Product not found in cart.");
      }
    } else {
      selectedProducts = orderItem.products;
    }

    if (quantity) {
      selectedProducts = selectedProducts.map((p) => ({
        productId: p.productId._id, // Ensure the productId is preserved
        quantity: quantity,
        price: p.productId?.price || 0,
      }));
    }

    // let totalPrice = selectedProducts.reduce((sum, p) => {
    //   return sum + p.productId.price * p.quantity;
    // }, 0);
    let totalPrice = selectedProducts.reduce((sum, p) => {
      return sum + (p.price || 0) * p.quantity; // Use the price after update
    }, 0);

    let newOrder = new Order({
      userId: req.user._id,
      products: selectedProducts.map((p) => ({
        productId: p.productId?._id,
        quantity: p.quantity,
      })),
      totalPrice,
      status: "pending",
      address: {
        country,
        city,
        area,
      },
    });

    await newOrder.save();

    orderItem.products = orderItem.products.filter(
      (p) =>
        !selectedProducts.some(
          (sp) => String(sp.productId._id) === String(p.productId._id)
        )
    );

    if (orderItem.products.length === 0) {
      await ProductCart.findOneAndDelete({ userId: req.user._id });
    } else {
      await orderItem.save();
    }

    // await ProductCart.findOneAndDelete({ userId: req.user._id });

    sendResponse(
      res,
      201,
      { order: newOrder },
      false,
      "Order placed successfully"
    );
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

      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      if (!order) return sendResponse(res, 404, null, true, "Order not found");

      if (status === "delivered") {
        await Order.findByIdAndDelete(orderId);
        return sendResponse(
          res,
          200,
          null,
          false,
          "Order delivered and removed from database"
        );
      }
      sendResponse(res, 200, order, false, "Order status updated");
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

export default router;
