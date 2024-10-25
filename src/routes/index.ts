import { Router } from 'express';
import CafeRoutes from './CafeRoutes';

const router = Router();

router.use('/cafes', CafeRoutes);

export default router;
