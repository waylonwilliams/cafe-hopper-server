import { Router } from 'express';
import { searchForCafes } from '@/controllers/CafeController';
import { reviewPing } from '@/controllers/ReviewController';

const router = Router();

// POST routes
router.post('/search/', searchForCafes);

// PUT routes
router.put('/ping', reviewPing);

export default router;
