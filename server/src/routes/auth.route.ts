import { Router } from "express";
import {
  logOut,
  session,
  login,
  googleAuth,
  googleCallback,
  sessionsList,
  deleteSession,
} from "@features/auth/controller";
import { sessionParser, userParser, asyncHandler } from "@middlewares";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/google", asyncHandler(googleAuth));
router.get("/google/callback", asyncHandler(googleCallback));

router.use([sessionParser, userParser]);
router.get("/logout", asyncHandler(logOut));
router.get("/session", asyncHandler(session));
router.delete("/session/:sessionId", asyncHandler(deleteSession));
router.get("/sessions", asyncHandler(sessionsList));

export default router;
