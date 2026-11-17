import { Router } from "express";
import { SearchRequestSchema } from "@paplet/shared";
import { searchController } from "../controllers/search.controller.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";

const router = Router();

router.post("/", validateRequest(SearchRequestSchema), searchController);

export default router;
