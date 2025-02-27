import express from "express";
import authRoutes from "./routes/auth.js";
import productRoutes  from "./routes/adminRoutes.js";
import cartRoutes  from "./routes/cartRoutes.js";
import orderRoutes  from "./routes/orderRoute.js";
import reviewRoutes  from "./routes/reviewRoute.js";
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
    app.use("/uploads" , express.static(path.join(path.resolve(), "uploads")))
    // app.use("/task", autheUser, taskRoutes);

    appServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB not connected Server is not running:", err.message);
    process.exit(1); // Exit the process if DB connection fails
  });
