import express from "express";
import sendResponse from "../helpers/Response.js";
import SaleDiscountProduct from "../models/disconutOffer.js";
import SaleDiscountOrder from "../models/SaleDiscountOrder.js";
import ProductCart from "../models/productCart.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import Joi from "joi";

const router = express.Router();

const shppingSchema = Joi.object({
  email: Joi.string()
    .pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
    .required()
    .messages({
      "string.pattern.base": "Email must be a valid Gmail address",
      "string.empty": "Email is required",
    }),

  firstName: Joi.string().min(2).max(30).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be less than 30 characters",
  }),

  lastName: Joi.string().min(2).max(30).required().messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be less than 30 characters",
  }),

  city: Joi.string().min(2).required().messages({
    "string.empty": "City is required",
    "string.min": "City name must be at least 2 characters",
  }),

  address: Joi.string().min(5).required().messages({
    "string.empty": "Address is required",
    "string.min": "Address must be at least 5 characters",
  }),

  posterCode: Joi.alternatives()
    .try(Joi.string().pattern(/^[A-Za-z0-9 ]{3,10}$/), Joi.number())
    .required(),

  phone: Joi.alternatives()
    .try(Joi.string().pattern(/^[0-9]{7,15}$/), Joi.number())
    .required(),

  quantity: Joi.number().integer().min(1).optional().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
  }),
  productId: Joi.string().optional(),
});

router.post("/placeSaleDiscountOrder", autheUser, async (req, res) => {
  try {
    const { error, value } = shppingSchema.validate(req.body);

    let selectedProducts = [];
    let totalPrice = 0;

    if (error) {
      return sendResponse(res, 201, null, true, error.details[0].message);
    }

    const {
      productId,
      email,
      firstName,
      lastName,
      city,
      address,
      quantity,
      posterCode,
      phone,
    } = value;

    if (productId) {
      const product = await SaleDiscountProduct.findById(productId);
      if (!product) {
        return sendResponse(res, 404, null, true, "Product not found.");
      }

      selectedProducts.push({
        productId: product._id,
        quantity: quantity || 1,
        price: product.discountPrice,
      });

      totalPrice = product.discountPrice * (quantity || 1);
    } else {
      const cart = await ProductCart.findOne({
        userId: req.user._id,
      }).populate("products.productId");

      if (!cart || !cart.products || cart.products.length === 0) {
        return sendResponse(res, 400, null, true, "Cart is empty.");
      }

      selectedProducts = cart.products.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      }));

      totalPrice = selectedProducts.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    const newOrder = new SaleDiscountOrder({
      userId: req.user._id,
      products: selectedProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),

      totalPrice,
      email,
      firstName,
      lastName,
      address,
      city,
      posterCode,
      phone,
    });

    await newOrder.save();

    await Promise.all(
      selectedProducts.map(async (p) => {
        await SaleDiscountProduct.findByIdAndUpdate(
          p.productId,
          { $inc: { inStock: -p.quantity } },
          { new: true }
        );
      })
    );

    if (productId) {
      await ProductCart.findOneAndDelete({ userId: req.user._id });
    }

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
      .populate("products.productId")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, salesOrders, false, "All sales orders retrieved");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.put(
  "/updateDiscountOrder/:orderId",
  autheUser,
  isAdminCheck,
  async (req, res) => {
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
