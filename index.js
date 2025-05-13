import express from "express";
import authRoutes from "./routes/auth.js";
import productRoutes  from "./routes/adminRoutes.js";
import cartRoutes  from "./routes/cartRoutes.js";
import orderRoutes  from "./routes/orderRoute.js";
import reviewRoutes  from "./routes/reviewRoute.js";
import SaleDiscountRoutes from "./routes/salesDiscount.js";
import SaleDiscountOrderRoutes from "./routes/saleDiscountOrderRoute.js";
import multipleOrdersRoutes from "./routes/multiOrder.js";
import contactRoute from "./routes/contactRoute.js";
import feedBackRoute from "./routes/feedBackRoute.js";
import subscribeRoute from "./routes/subscribeRoute.js";
import morgan from "morgan";
import connectDB from "./database/data.js";
import cors from "cors";
import "dotenv/config";
import http from "http";
import path from "path";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors("*"));
app.use(morgan(`dev`));

const appServer = http.createServer(app);


connectDB()
  .then(() => {
    app.get("/", (req, res) => {
      res.send("Server is running and DB is connected");
    });

    app.use("/user", authRoutes);
    app.use("/admin" , productRoutes);
    app.use("/cart" , cartRoutes);
    app.use("/order" , orderRoutes);
    app.use("/review" , reviewRoutes);
    app.use("/sale-discounts", SaleDiscountRoutes);
    app.use("/saleDiscountsOrder", SaleDiscountOrderRoutes);
    app.use("/multiorders", multipleOrdersRoutes);
    app.use("/contact-us", contactRoute);
    app.use("/feed-back", feedBackRoute);
    app.use("/Subscriber", subscribeRoute);
    // app.use("/uploads" , express.static(path.join(path.resolve(), "uploads")))

    appServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB not connected Server is not running:", err.message);
    process.exit(1); // Exit the process if DB connection fails
  });
