import express from "express";
import sendResponse from "../helpers/Response.js";
import SaleDiscountProduct from "../models/disconutOffer.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import upload from "../middleware/uploadImage.js";
import cloudinary from "../config/cloudinary.js";


const router = express.Router();

router.post("/addDiscount", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const {
        productName,
        // description,
        SalesCategory,
        originalPrice,
        discountPrice,
        inStock,
        offerTitle,
        offerDescription,
        expiresAt,
      } = req.body;

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

       const newDiscount = new SaleDiscountProduct({
         name: productName,
         SalesCategory,
         price: originalPrice,
         discountPrice,
         image: optimizeUrl,
         inStock: inStock,
         offerTitle,
         offerDescription,
         expiresAt: expiresAt ? new Date(expiresAt) : null,
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
    const discounts = await SaleDiscountProduct.find()
      .sort({ createdAt: 1 })
      .limit(3);

    const lastThreeSorted = discounts.reverse();
    sendResponse(
      res,
      200,
      lastThreeSorted,
      false,
      "discounts fetch product successfully"
    );
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/getAllProducts", async (req, res) => {
  try {
    const discounts = await SaleDiscountProduct.find()
      .sort({ createdAt: -1 });
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
      const {
        name,
        description,
        SalesCategory,
        originalPrice,
        discountPrice,
        inStock,
        offerTitle,
        offerDescription,
        expiresAt,
      } = req.body;

      const updateData = {
        name,
        description,
        SalesCategory,
        price: originalPrice,
        discountPrice,
        inStock,
        offerTitle,
        offerDescription,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      };

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
          secure: true,
        });

        updateData.image = optimizedImage;
      }


      const updated = await SaleDiscountProduct.findByIdAndUpdate(
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
        { updated },
        false,
        "sales disconut offer Product updated successfully"
      );
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);


router.delete("/deleteDiscountOffer/:id", autheUser, isAdminCheck, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await SaleDiscountProduct.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Discount offer Product not found" });
    }

    sendResponse(
      res,
      201,
      deletedProduct,
      false,
      "Discount offer Product deleted successfully"
    );
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});


export default router;
