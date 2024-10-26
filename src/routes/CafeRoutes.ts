import { Router } from 'express';
import { searchCafes, searchMaps, searchCafesV3 } from '@/controllers/CafeController';

const router = Router();

// GET routes
router.get('/search/:name', searchCafes);
router.get('/maps/:search', searchMaps);

// POST routes
router.post('/search/', searchCafesV3);

// I have searchCafesV2 and V1 in controllers/CafeController.ts, you can use them if you'd like
// But searchCafesV3 is the latest version and works probably the best in regards to performance and accuracy

export default router;
