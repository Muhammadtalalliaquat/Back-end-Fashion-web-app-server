import express from "express";
import Product from "../models/products.js";
import sendResponse from "../helpers/Response.js";
import {autheUser , isAdminCheck} from "../middleware/authUser.js";
// import isAdminCheck from "../middleware/authUser.js";
import uploads from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // if (!req.user.isAdmin) {
    //   sendResponse(res, 500, null, true, { message: "Access denied" });
    // }
    const product = await Product.find();
    sendResponse(res, 200, product, false, "Product fetch successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.post("/addProdcuts", autheUser , isAdminCheck , uploads.single("image"), async (req, res) => {
    try {
      //   if (!req.user.isAdmin) {
      //     sendResponse(res, 500, null, true, { message: "Access denied" });
      //   }
      const { name, price, description, category, stock } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;

      const newProduct = new Product({
        name,
        price,
        description,
        category,
        stock,
        image,
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
      sendResponse(res, 500, null, true, error.message);
    }
  }
);

// router.put("/edit/:id", autheUser, uploads.single("image"),
//     async (req, res) => {
//       try {
//         const { id } = req.params; // Get the product ID from URL

//         const { name, price, description, category } = req.body;
//         const updateData = { name, description, price, category };

//         if (req.file) {
//           updateData.image = `/uploads/${req.file.filename}`;
//         }

//         // ✅ Ensure product exists before updating
//         const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

//         if (!updatedProduct) {
//           return sendResponse(res, 404, null, true, "Product not found");
//         }

//         sendResponse(res, 200, { product: updatedProduct }, false, "Product updated successfully");
//       } catch (error) {
//         sendResponse(res, 500, null, true, error.message);
//       }
//     }
//   );

router.put("/edit/:id", autheUser, isAdminCheck , uploads.single("image"),
  async (req, res) => {
    try {
      //   if (!req.user.isAdmin) {
      //     sendResponse(res, 500, null, true, { message: "Access denied" });
      //   }
      const { id } = req.params;
      const { name, price, description, category , stock } = req.body;
      const updateData = { name, price, description, category, stock };

      if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await Product.findByIdAndUpdate( id, updateData, { new: true });

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

router.delete("/delete/:id", autheUser, isAdminCheck , async (req, res) => {
  try {
    // if (!req.user.isAdmin) {
    //   sendResponse(res, 500, null, true, { message: "Access denied" });
    // }
    const { id } = req.params;

    await Product.findByIdAndDelete(id);
    sendResponse(res, 201, null, false, "Product deleted successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
