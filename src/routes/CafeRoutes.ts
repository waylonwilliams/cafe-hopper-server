import { Router } from "express";
import { searchCafes, searchMaps } from "@/controllers/CafeController";

const router = Router();

router.get("/search/:name", searchCafes);
router.get("/maps/:search", searchMaps);

export default router;
