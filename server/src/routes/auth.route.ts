import asyncHandler from "@middlewares/asyncHandler";
import userParser from "@middlewares/userParser";
import { Router } from "express";
import {
  logOut,
  session,
  login,
  googleAuth,
  googleCallback,
} from "@features/auth/controller";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/logout", [userParser], asyncHandler(logOut));
router.get("/session", [userParser], asyncHandler(session));
router.get("/google", asyncHandler(googleAuth));
router.get("/google/callback", asyncHandler(googleCallback));

export default router;
