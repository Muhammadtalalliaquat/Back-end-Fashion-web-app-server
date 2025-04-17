import express from "express";
import sendResponse from "../helpers/Response.js";
import SaleDiscount from "../models/disconutOffer.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import upload from "../middleware/uploadImage.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

router.post("/addDiscount", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const { productName, originalPrice, discountPrice } = req.body;

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: "products",
        resource_type: "image",
        timestamp: +new Date(),
      });
      console.log("Cloudinary Upload Result:", uploadResult);

      const optimizeUrl = cloudinary.url(uploadResult.public_id, {
        fetch_format: "auto",
        quality: "auto",
      });

      console.log("Optimized Image URL:", optimizeUrl);

      const autoCropUrl = cloudinary.url(uploadResult.public_id, {
        crop: "auto",
        gravity: "auto",
        width: 500,
        height: 500,
      });

      console.log("Auto Cropped Image URL:", autoCropUrl);

      const newDiscount = new SaleDiscount({
        productName,
        originalPrice,
        discountPrice,
        image: optimizeUrl,
      });
      const saved = await newDiscount.save();
      sendResponse(
        res,
        200,
        saved,
        false,
        "sales disconut offer Product add successfully"
      );
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const discounts = await SaleDiscount.find().sort({ createdAt: -1 });
    sendResponse(
      res,
      200,
      discounts,
      false,
      "discounts fetch product successfully"
    );
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.put("/updateDiscountOffer/:id", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const { productName, originalPrice, discountPrice } = req.body;
      const updateData = { productName, originalPrice, discountPrice };

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "products",
          transformation: [
            { fetch_format: "auto", quality: "auto" },
            {
              width: 1000, 
              crop: "scale",
            },
          ],
        });

        console.log("Cloudinary Upload Result:", uploadResult);

        const optimizedImage = cloudinary.url(uploadResult.public_id, {
          fetch_format: "auto",
          quality: "auto",
        });

        updateData.image = optimizedImage;
      }


      const updated = await SaleDiscount.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!updated) {
        return sendResponse(res, 404, null, true, "Discount not found");
      }

      sendResponse(
        res,
        200,
        updated,
        false,
        "sales disconut offer Product updated successfully"
      );
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);


export default router;
