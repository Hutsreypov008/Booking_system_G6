import express from "express";
import cors from "cors";
import path from "path";
import roomRoutes from "./routes/room.route";
import userRoutes from "./routes/user.route";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Booking system API is running" });
});

app.use("/api/rooms", roomRoutes);
app.use("/api", userRoutes);

export default app;
