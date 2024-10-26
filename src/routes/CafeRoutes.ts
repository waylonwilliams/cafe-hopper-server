import { Router } from 'express';
import { searchCafes, searchMaps, searchCafesV3 } from '@/controllers/CafeController';

const router = Router();

// GET routes
router.get('/search/:name', searchCafes);
router.get('/maps/:search', searchMaps);

// POST routes
router.post('/search/', searchCafesV3);
// To rewrite this route I want to first query Places API, fetch the place Ids,
// And then query Supabase to see if those place Ids exist in our database.
// If not, we will insert them into our database.

export default router;
