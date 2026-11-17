import { Router } from "express";
import { AskRequestSchema } from "@paplet/shared";
import { askController } from "../controllers/ask.controller.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";

const router = Router();

router.post("/", validateRequest(AskRequestSchema), askController);

export default router;
