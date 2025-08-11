import express from "express";
import ProductReview from "../models/productReview.js";
import Product from "../models/products.js";
import sendResponse from "../helpers/Response.js";
import SaleDiscountProduct from "../models/disconutOffer.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import upload from "../middleware/uploadImage.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

router.post("/addReview", autheUser, upload.single("image"), async (req, res) => {
    try {
      const { productId, rating, comment } = req.body;

      if (!productId || !rating || !comment) {
        return sendResponse(res, 400, null, true, "All fields are required.");
      }

      let optimizeUrl = "";

      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "products/reviewimage",
          resource_type: "image",
        });

        optimizeUrl = cloudinary.url(uploadResult.public_id, {
          fetch_format: "auto",
          quality: "auto",
        });

        console.log("Auto Cropped Image URL:", optimizeUrl);
      }

      const isSaleProduct = await SaleDiscountProduct.findById(productId);

      let review = await ProductReview.findOne({
        userId: req.user._id,
        "products.productId": productId,
      }).populate("userId", "userName email");

      if (review) {
        review.rating = rating;
        review.comment = comment;
        if (optimizeUrl) {
          review.image = optimizeUrl;
        }
      } else {
        review = new ProductReview({
          userId: req.user._id.toString(),
          // productId,
          products: [
            {
              productId,
              productModel: isSaleProduct ? "SaleDiscountProduct" : "Product",
            },
          ],
          rating,
          comment,
          image: optimizeUrl || undefined,
          createdAt: new Date(),
        });
      }

      await review.save();

      const updateReviews = await ProductReview.find({
        "products.productId": productId,
      }).populate("userId", "userName email");

      const avgRating =
        updateReviews.reduce((acc, review) => acc + review.rating, 0) /
        updateReviews.length;

      if (isSaleProduct) {
        await SaleDiscountProduct.findByIdAndUpdate(productId, {
          rating: avgRating,
        });
      } else {
        await Product.findByIdAndUpdate(productId, { rating: avgRating });
      }
      // await Product.findByIdAndUpdate(productId, { rating: avgRating });

      console.log("review data here", avgRating);

      sendResponse(res, 200, updateReviews, false, "Review submitted");
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

router.get("/productReviews/:productId", async (req, res) => {
  try {
    let reviews = await ProductReview.find({
      "products.productId": req.params.productId,
    }).populate("userId", "userName email");

    if (!reviews || reviews.length === 0) {
      return sendResponse(
        res,
        200,
        [],
        false,
        "No reviews found for this product"
      );
    }
    console.log("reviews data here", reviews);

    sendResponse(res, 200, reviews, false, "Product reviews fetched");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.delete(
  "/deleteReview/:reviewId",
  autheUser,
  isAdminCheck,
  async (req, res) => {
    try {
      let review = await ProductReview.findById(req.params.reviewId);

      if (!review)
        return sendResponse(res, 404, null, true, "Review not found");

      if (
        review.userId.toString() !== req.user._id.toString() &&
        !req.user.isAdmin
      ) {
        return sendResponse(res, 403, null, true, "Not authorized to delete");
      }

      await ProductReview.findByIdAndDelete(req.params.reviewId);

      sendResponse(res, 200, review, false, "Review deleted");
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

export default router;
