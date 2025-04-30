import express from "express";
import sendResponse from "../helpers/Response.js";
import Contact from "../models/contact.js";
import Joi from "joi";
import { autheUser } from "../middleware/authUser.js";
import nodemailer from "nodemailer";

const router = express.Router();

const registerSchema = Joi.object({
  firstName: Joi.string().min(2).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters",
  }),
  lastName: Joi.string().min(2).required().messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 characters",
  }),
  email: Joi.string()
    .pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
    .required()
    .messages({
      "string.pattern.base": "Email must be a valid Gmail address",
    }),
  message: Joi.string().min(5).required().messages({
    "string.empty": "Message is required",
    "string.min": "Message must be at least 5 characters",
  }),
});

const transporter = nodemailer.createTransport({
  service: `Gmail`,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD,
  },
});


function sendEmail(recepientEmail) {
  const mailOption = {
    from: process.env.SENDER_EMAIL,
    to: recepientEmail,
    subject: "Thank you for contacting us",
    html: `<p>Thank you for reaching out! We have received your message and will get back to you as soon as possible.</p>`,
  };
  transporter.sendMail(mailOption, (error, succes) => {
    if (error) {
      console.log("Erro sending email", error);
      return;
    }
    console.log("Email successfully sent.", succes.response);
    res.send("email sended");
  });
}



router.post("/addContact", autheUser, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return sendResponse(res, 201, null, true, error.message);

    const { firstName, lastName, email, message } = value;

    if (!firstName || !lastName || !email || !message) {
      return sendResponse(res, 400, null, true, "All fields are required.");
    }

    const newContact = new Contact({
      firstName,
      lastName,
      email,
      message,
    });

    sendEmail(email);

    await newContact.save();
    sendResponse(
      res,
      200,
      newContact,
      false,
      "Your message has been sent successfully."
    );
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

// router.post("/addContact", autheUser, async (req, res) => {
//   const { error, value } = registerSchema.validate(req.body);
//   try {
//     if (!firstName || !lastName || !email || !message) {
//       return sendResponse(res, 400, null, true, "All fields are required.");
//     }

//     if (error) return sendResponse(res, 201, null, true, error.message);
//     const { firstName, lastName, email, message } = value;

//     const newContact = new Contact({
//       firstName,
//       lastName,
//       email,
//       message,
//     });

//     sendEmail(email);

//     newContact.save();
//     sendResponse(
//       res,
//       201,
//       newContact,
//       false,
//       "Your message has been sent successfully."
//     );
//   } catch (error) {
//     sendResponse(res, 500, null, true, error.message);
//   }
// });

router.get("/getContacts", async (req, res) => {
  try {
    const contact = await Contact.find();
    sendResponse(res, 200, contact, false, "Contact fetch successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

export default router;