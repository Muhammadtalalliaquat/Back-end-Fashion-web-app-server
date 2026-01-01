import express from "express";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/adminRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoute.js";
import reviewRoutes from "./routes/reviewRoute.js";
import SaleDiscountRoutes from "./routes/salesDiscount.js";
import SaleDiscountOrderRoutes from "./routes/saleDiscountOrderRoute.js";
import multipleOrdersRoutes from "./routes/multiOrder.js";
import contactRoute from "./routes/contactRoute.js";
import feedBackRoute from "./routes/feedBackRoute.js";
import subscribeRoute from "./routes/subscribeRoute.js";
import wishListRoute from "./routes/wishListRoute.js";
import morgan from "morgan";
import connectDB from "./database/data.js";
import cors from "cors";
import "dotenv/config";
// import http from "http";
// import path from "path";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors("*"));
app.use(morgan(`dev`));

// const appServer = http.createServer(app);

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB Connection Error:", error);
    res.status(500).json({
      error: true,
      data: null,
      msg: "Database connection failed",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running and DB is connected");
});

app.use("/user", authRoutes);
app.use("/admin", productRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use("/review", reviewRoutes);
app.use("/sale-discounts", SaleDiscountRoutes);
app.use("/saleDiscountsOrder", SaleDiscountOrderRoutes);
app.use("/multiorders", multipleOrdersRoutes);
app.use("/contact-us", contactRoute);
app.use("/feed-back", feedBackRoute);
app.use("/Subscriber", subscribeRoute);
app.use("/productWishList", wishListRoute);
// app.use("/uploads" , express.static(path.join(path.resolve(), "uploads")))

// const api = functions.https.onRequest(app);


if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
}
export default app;

