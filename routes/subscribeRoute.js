
import express from "express";
import sendResponse from "../helpers/Response.js";
import { autheUser } from "../middleware/authUser.js";
import Subscriber from "./../models/subscribe.js";
import Joi from "joi";

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string()
    .pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
    .required()
    .messages({
      "string.pattern.base": "Email must be a valid Gmail address",
    }),
  unsubscribe: Joi.boolean().optional(),
});

router.post("/addSubscribe", async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  const { unsubscribe } = req.body; // new flag

  if (error) return sendResponse(res, 400, null, true, error.message);

  try {
    const { email } = value;
    const existing = await Subscriber.findOne({ email });

    if (unsubscribe) {
      if (existing) {
        await Subscriber.deleteOne({ email });
        return sendResponse(
          res,
          200,
          null,
          false,
          "You have been unsubscribed successfully."
        );
      } else {
        return sendResponse(res, 400, null, true, "You are not subscribed.");
      }
    }

    if (existing) {
      return sendResponse(res, 200, null, false, "You are already subscribed.");
    }

    const newSubscribe = new Subscriber({ email });
    await newSubscribe.save();

    return sendResponse(
      res,
      201,
      newSubscribe,
      false,
      "You have been subscribed successfully."
    );
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

// router.post("/addSubscribe", async (req, res) => {
//   const { error, value } = registerSchema.validate(req.body);
//   try {
//     if (error) return sendResponse(res, 201, null, true, error.message);

//     const { email } = value;

//     const existing = await Subscriber.findOne({ email });

//     if (existing) {
//       return sendResponse(
//         res,
//         200,
//         null,
//         false,
//         "You have been already subscribed."
//       );
//     }

//     const newSubscribe = new Subscriber({
//       email,
//     });

//     newSubscribe.save();
//     sendResponse(
//       res,
//       201,
//       newSubscribe,
//       false,
//       "Your Subscriber has been sent successfully."
//     );
//   } catch (error) {
//     sendResponse(res, 500, null, true, error.message);
//   }
// });

router.get("/getSubscribe", async (req, res) => {
  try {
    const contact = await Subscriber.find();
    if (!contact) {
      return sendResponse(res, 404, null, true, "No feedback found");
    }
    sendResponse(res, 200, contact, false, "Subscriber fetched successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
