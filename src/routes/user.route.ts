import express from "express";
import { UserController } from "../controllers/user.controller";

const router = express.Router();
const controller = new UserController();

router.get("/users", (req, res) => controller.index(req, res));
router.post("/users", (req, res) => controller.create(req, res));
router.delete("/users/:id", (req, res) => controller.delete(req, res));

export default router;
