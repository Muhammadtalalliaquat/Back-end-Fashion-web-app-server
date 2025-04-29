import express from "express";
import sendResponse from "../helpers/Response.js";
import FeedBack from "../models/feedback.js";
import { autheUser } from "../middleware/authUser.js";

const router = express.Router();


router.post("/addFeedBack", autheUser, async (req, res) => {
  const { feedBackMessage } = req.body;
  try {
    if (!feedBackMessage) {
      return sendResponse(res, 400, null, true, "message are required.");
    }

    const userId = req.user._id;

    const newFeedBack = new FeedBack({
      feedBackMessage,
      userId,
    });


    newFeedBack.save();
    sendResponse(
      res,
      201,
      newFeedBack,
      false,
      "Your feeback has been sent successfully."
    );
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/getFeedBack", async (req, res) => {
  try {
    const contact = await FeedBack.find().populate("userId", "userName email");
    if (!contact) {
      return sendResponse(res, 404, null, true, "No feedback found");
    }
    sendResponse(res, 200, contact, false, "Feedback fetched successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});


export default router;
