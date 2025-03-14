import express from "express";
import Product from "../models/products.js";
import sendResponse from "../helpers/Response.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import upload from "../middleware/uploadImage.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const product = await Product.find();
    sendResponse(res, 200, product, false, "Product fetch successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.post("/addProdcuts", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      // console.log("File Data:", req.file);
      // console.log("Form Data:", req.body);

      const { name, price, description, category, stock } = req.body;
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: "products",
        resource_type: "image",
        timestamp: +new Date(),
      });
      console.log("Cloudinary Upload Result:", uploadResult);

      // Optimize & Transform Image
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

      const newProduct = new Product({
        name,
        price,
        description,
        category,
        stock,
        image: optimizeUrl,
      });
      await newProduct.save();
      sendResponse(
        res,
        201,
        { product: newProduct },
        false,
        "Product save successfully"
      );
    } catch (error) {
      console.error("Error adding product:", error || error);
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

router.put("/edit/:id", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, description, category, stock } = req.body;
      const updateData = { name, price, description, category, stock };

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "products",
          transformation: [
            {
              fetch_format: "auto",
              quality: "auto",
            },
            {
              width: 500,
              height: 500,
              crop: "auto",
              gravity: "auto",
            },
          ],
        });
        console.log("Cloudinary Upload Result:", uploadResult);
        updateData.image = uploadResult.secure_url;

        // Optimize & Transform Image
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
      }

      const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!updatedProduct) {
        return sendResponse(res, 404, null, true, "Product not found");
      }

      sendResponse(
        res,
        201,
        { product: updatedProduct },
        false,
        "Product updated successfully"
      );
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

router.delete("/delete/:id", autheUser, isAdminCheck, async (req, res) => {
  try {
    // if (!req.user.isAdmin) {
    //   sendResponse(res, 500, null, true, { message: "Access denied" });
    // }
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    sendResponse(res, 201, deletedProduct, false, "Product deleted successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
