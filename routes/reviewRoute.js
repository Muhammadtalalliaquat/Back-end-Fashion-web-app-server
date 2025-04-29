import express from "express";
import ProductReview from "../models/productReview.js";
import Product from "../models/products.js";
import sendResponse from "../helpers/Response.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";

const router = express.Router();

router.post("/addReview", autheUser, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return sendResponse(res, 400, null, true, "All fields are required.");
    } 
    let review = await ProductReview.findOne({
      userId: req.user._id,
      productId,
    }).populate("userId", "userName email");

    if (review) {
      review.rating = rating;
      review.comment = comment;
    } else {
      review = new ProductReview({
        userId: req.user._id.toString(),
        productId,
        rating,
        comment,
        createdAt: new Date(),
      });
    }

    await review.save();

    const updateReviews = await ProductReview.find({ productId }).populate(
      "userId",
      "userName email"
    );
    const avgRating =
      updateReviews.reduce((acc, review) => acc + review.rating, 0) /
      updateReviews.length;

    await Product.findByIdAndUpdate(productId, { rating: avgRating });

    console.log("review data here", updateReviews);

    sendResponse(res, 200, updateReviews, false, "Review submitted");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/productReviews/:productId", async (req, res) => {
  try {
    let reviews = await ProductReview.find({
      productId: req.params.productId,
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

router.delete("/deleteReview/:reviewId", autheUser, isAdminCheck, async (req, res) => {
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
