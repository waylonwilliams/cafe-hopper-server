import { Router } from 'express';
import { searchCafes, searchMaps, searchCafesV2 } from '@/controllers/CafeController';

const router = Router();

// GET routes
router.get('/search/:name', searchCafes);
router.get('/maps/:search', searchMaps);

// POST routes
router.post('/search/', searchCafesV2);

export default router;
