import express from "express";
import sendResponse from "../helpers/Response.js";
import MultiOrder from "../models/multipleOrders.js";
import Product from "../models/products.js";
import SaleDiscountProduct from "../models/disconutOffer.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import ProductCart from "../models/productCart.js";
import nodemailer from "nodemailer";
import Joi from "joi";

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
          <img src="${item.image}" alt="Product Image" width="80" style="border-radius:8px;" />
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

  selectedProducts: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required().messages({
          "string.base": "Product ID must be a string",
          "any.required": "Product ID is required",
        }),
        productType: Joi.string()
          .valid("Product", "SaleDiscountProduct")
          .required(),
        quantity: Joi.number().min(1).required(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Selected products must be an array",
      "array.min": "At least one product must be selected",
    }),
});

// async function cleanCartAfterOrder(userId, selectedProducts) {
//   try {
//     const selectedIds = selectedProducts
//       .map((p) => {
//         if (!p.productId) return null;

//         if (typeof p.productId === "object" && p.productId._id) {
//           return p.productId._id.toString();
//         }

//         return p.productId.toString();
//       })
//       .filter(Boolean);

//     const objectIdArray = selectedIds.map(
//       (id) => new mongoose.Types.ObjectId(id)
//     );

//     await ProductCart.updateOne(
//       { userId: userId },
//       { $pull: { products: { productId: { $in: objectIdArray } } } }
//     );

//     console.log("✅ Cart cleaned successfully after order");
//   } catch (error) {
//     console.error("❌ Cart cleaning error:", error);
//   }
// }

router.post("/multiOrder", autheUser, async (req, res) => {
  try {
    const { error, value } = shppingSchema.validate(req.body);
    const userId = req.user._id;
    const {
      selectedProducts,
      email,
      firstName,
      lastName,
      address,
      city,
      posterCode,
      phone,
    } = value;

    if (error) {
      return sendResponse(res, 201, null, true, error.message);
    }

    if (!selectedProducts || selectedProducts.length === 0) {
      return sendResponse(res, 404, null, true, "No products selected.");
    }

    let totalPrice = 0;
    const formattedProducts = [];

    for (const item of selectedProducts) {
      const Model =
        item.productType === "SaleDiscountProduct"
          ? SaleDiscountProduct
          : Product;
      const product = await Model.findById(item.productId);
      if (!product) continue;

      const quantity = item.quantity || 1;
      const price = product.discountPrice || product.price;
      const image = Array.isArray(product.images)
        ? product.images[0]
        : product.image;

      totalPrice += price * quantity;

      formattedProducts.push({
        productId: product._id.toString(),
        productType: item.productType,
        name: product.name,
        image,
        quantity,
        price,
        category: product.category || product.SalesCategory,
        stock: product.stock || product.inStock,
      });
    }

    console.log("Sending selectedProducts:", formattedProducts);

    const newOrder = new MultiOrder({
      userId,
      products: formattedProducts,
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

   

   const selectedIds = selectedProducts.map((p) => p.productId.toString());

   await ProductCart.updateOne(
     { userId: userId },
     { $pull: { products: { productId: { $in: selectedIds } } } }
   );

    sendEmail(email, {
      firstName,
      lastName,
      products: formattedProducts,
      totalPrice,
    });

    return sendResponse(
      res,
      201,
      { order: newOrder },
      false,
      "Order placed successfully."
    );
  } catch (error) {
    console.error("Order error:", error);
    return sendResponse(res, 500, null, true, "Something went wrong.");
  }
});

router.get("/getAllmultiOrders", autheUser, async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { userId: req.user._id };

    const orders = await MultiOrder.find(filter)
      // .populate("userId", "userName email isAdmin")
      .sort({ createdAt: -1 })
      .populate("products.productId");
    sendResponse(res, 200, orders, false, "All Multiples orders Get");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/getMltiChartOrders", async (req, res) => {
  try {
    // const filter = req.user.isAdmin ? {} : { userId: req.user._id };

    const orders = await MultiOrder.find()
      // .populate("userId", "userName email isAdmin")
      .populate("products.productId");
    sendResponse(res, 200, orders, false, "All Multiples orders Get");
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

      const order = await MultiOrder.findByIdAndUpdate(
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
        await MultiOrder.findByIdAndDelete(orderId);
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
