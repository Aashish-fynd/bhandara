import { Router } from "express";
import eventsRouter from "./events.route";

const router = Router();

router.use("/events", eventsRouter);

export default router;
