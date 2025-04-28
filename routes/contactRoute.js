import express from "express";
import sendResponse from "../helpers/Response.js";
import Contact from "../models/contact.js";
import { autheUser } from "../middleware/authUser.js";
import nodemailer from "nodemailer";

const router = express.Router();

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
  const { firstName, lastName, email, message } = req.body;
  try {
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

    newContact.save();
    sendResponse(
      res,
      201,
      newContact,
      false,
      "Your message has been sent successfully."
    );
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/getContacts", async (req, res) => {
  try {
    const contact = await Contact.find();
    sendResponse(res, 200, contact, false, "Contact fetch successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

export default router;