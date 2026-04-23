import { Router } from "express";
import { authControllers } from "./auth.controller";

const router = Router();

router.post("/signup", authControllers.signup);

router.post("/signin", authControllers.signin);

export const authRoutes = router;
