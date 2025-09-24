import express from "express";
import sendResponse from "../helpers/Response.js";
import ProductCart from "../models/productCart.js";
import Product from "../models/products.js";
import Order from "../models/order.js";
import Joi from "joi";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import nodemailer from "nodemailer";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: `Gmail`,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD,
  },
});

const sendEmail = (recepientEmail, orderDetails) => {
  const { firstName, lastName, products, totalPrice } = orderDetails;

  const productListHtml = products
    .map(
      (item) => `
       <tr style="border-bottom:1px solid #ddd;">
        <td style="padding:10px;">
          <img src="${item.image[0]}" alt="Product Image" width="80" style="border-radius:8px;" />
        </td>
        <td style="padding:10px;">
          <strong>${item.name}</strong><br/>
          Quantity: ${item.quantity}<br/>
          Price: Rs. ${item.price}
        </td>
      </tr>
      `
    )
    .join("");

  const mailOption = {
    from: process.env.SENDER_EMAIL,
    to: recepientEmail,
    subject: "🛒 Your Order Confirmation - Thank You!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Thank you for your order, ${firstName}!</h2>
        <p>Hi ${firstName} ${lastName},</p>
        <p>We appreciate your purchase. Below are your order details:</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          ${productListHtml}
        </table>

        <h3 style="margin-top: 30px;">Total Amount: Rs. ${totalPrice}</h3>

        <p style="margin-top: 30px;">You’ll receive another email when your items are shipped.</p>
        <p>If you have any questions, feel free to reply to this email.</p>

        <p style="margin-top: 40px;">Best regards,<br/><strong>Your Store Team</strong></p>
      </div>
    `,
  };

  transporter.sendMail(mailOption, (error, success) => {
    if (error) {
      console.log("Error sending email:", error);
      return;
    }
    console.log("Email successfully sent:", success.response);
  });
};

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

router.post("/placeOrder", autheUser, async (req, res) => {
  try {
    const { error, value } = shppingSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return sendResponse(
        res,
        200,
        null,
        true,
        error.details.map((err) => err.message)
      );
    }
    const userId = req.user._id;

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

    let selectedProducts = [];
    let totalPrice = 0;

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return sendResponse(res, 404, null, true, "Product not found.");
      }

      selectedProducts.push({
        productId: product._id,
        name: product.name,
        image: product.images,
        quantity: quantity || 1,
        price: product.price,
      });

      totalPrice = product.price * (quantity || 1);
    } else {
      const cart = await ProductCart.findOne({
        userId: req.user._id,
      }).populate("products.productId");

      if (!cart || !cart.products || cart.products.length === 0) {
        return sendResponse(res, 400, null, true, "Cart is empty.");
      }

      selectedProducts = cart.products.map((item) => ({
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.images,
        quantity: item.quantity,
        price: item.productId.price,
      }));

      totalPrice = selectedProducts.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    const newOrder = new Order({
      userId,
      products: selectedProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
      totalPrice,
      status: "pending",
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
        await Product.findByIdAndUpdate(
          p.productId,
          { $inc: { stock: -p.quantity } },
          { new: true }
        );
      })
    );

    const enrichedProducts = await Promise.all(
      newOrder.products.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        return {
          productId: product._id,
          name: product.name,
          image: product.images,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    console.log("order data is here:", enrichedProducts);

    sendEmail(email, {
      firstName,
      lastName,
      products: enrichedProducts,
      totalPrice,
    });

    if (productId) {
      await ProductCart.updateOne(
        { userId: userId },
        { $pull: { products: { productId: { $in: productId } } } }
      );
    }

    return sendResponse(
      res,
      201,
      { order: newOrder },
      false,
      "Order placed successfully."
    );
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, null, true, "Something went wrong.");
  }
});

router.get("/allOrders", autheUser, async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { userId: req.user._id };

    const orders = await Order.find(filter)
      .populate("userId", "userName email isAdmin")
      .sort({ createdAt: -1 })
      .populate("products.productId");
    sendResponse(res, 200, orders, false, "All orders retrieved");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/getChartOrders", async (req, res) => {
  try {
    // const filter = req.user.isAdmin ? {} : { userId: req.user._id };
    const orders = await Order.find()
      .populate("userId", "userName email isAdmin")
      .populate("products.productId");
    sendResponse(res, 200, orders, false, "All orders retrieved");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

const sendStatusUpdateEmail = (email, name, status, orderId) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: `Your Order #${orderId} Status Updated`,
    html: `
      <p>Dear ${name},</p>
      <p>We wanted to inform you that the status of your order <strong>#${orderId}</strong> has been updated to:</p>
      <h3 style="color: #007bff;">${status.toUpperCase()}</h3>
      ${
        status === "delivered"
          ? "<p>Thank you for shopping with us. Your order has been delivered successfully!</p>"
          : "<p>You will be notified as it progresses further.</p>"
      }
      <br/>
      <p>Regards,<br/>Your Store Team</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, success) => {
    if (error) {
      console.log("Error sending status update email:", error);
    } else {
      console.log("Status update email sent:", success.response);
    }
  });
};

router.put(
  "/updateOrder/:orderId",
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

      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      if (!order) return sendResponse(res, 404, null, true, "Order not found");

      sendStatusUpdateEmail(
        order.email,
        `${order.firstName} ${order.lastName}`,
        status,
        order._id
      );

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
