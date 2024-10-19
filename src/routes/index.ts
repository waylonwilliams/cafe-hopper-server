import { Router } from "express";
import cafeRoutes from "./cafeRoutes";

const router = Router();

router.use("/cafes", cafeRoutes);

export default router;
