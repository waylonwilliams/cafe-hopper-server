import { Request, Response } from 'express';
import { TextSearch, GetPlaceDetails, TextSearchV2 } from '@/utils/maps/Places';
import {
  CreateNewCafesFromPlaceData,
  QueryCafesByName,
  DynamicCafeQuery,
  PushNewCafesToSupabase,
  GetCafesByIDAndQuery,
} from '@/utils/supabase/Cafe';
import { PlaceDataWithId, CafeSearchRequest, CafeSearchResponse, Cafe } from '@/utils/types';

/**
 * Search cafes using Google Places API and Supabase.
 * Queries cafes by name from Supabase and fills in missing cafes from Google Places.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const searchCafes = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = req.params.name;

    const cafesSupabase = await QueryCafesByName(name);
    if (cafesSupabase instanceof Error) {
      res.status(400).json({ error: cafesSupabase.message });
      throw cafesSupabase;
    }

    const places = await searchAndFilterPlaces(name, cafesSupabase);
    if (places instanceof Error) {
      res.status(400).json({ error: places.message });
      throw places;
    }

    // Send the final response
    res.json(places);
  } catch (error) {
    // Catch any unexpected errors and send a 500 response
    res.status(500).json({ error: 'An unexpected error occurred', message: error });
  }
};

export const searchMaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const location = req.params.search;
    const places = await searchAndFilterPlaces(location);
    if (places instanceof Error) {
      res.status(400).json({ error: places.message });
      throw places;
    }
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred', message: error });
  }
};

/**
 * Search and filter places.
 * @param {string} query - The search query.
 * @param {PlaceDataWithId[]} cafesSupabase - The cafes from Supabase.
 * @returns The cafes from Supabase and Google Places, or an error if there is one.
 */
const searchAndFilterPlaces = async (query: string, cafesSupabase: Cafe[] = []) => {
  const textSearchResponse = await TextSearch(query);
  const results = textSearchResponse.data.results;

  const places: PlaceDataWithId[] = [];
  for (let i = 0; i < results.length; i++) {
    const place = results[i];
    if (!place.place_id) {
      return new Error('place_id is required');
    }
    const placeDetails = await GetPlaceDetails(place.place_id);
    places.push({ ...placeDetails.data.result, place_id: place.place_id });
  }

  const cafesPlacesAPI = CreateNewCafesFromPlaceData(places);
  if (cafesPlacesAPI instanceof Error) {
    return cafesPlacesAPI;
  }

  const cafesToPush = cafesPlacesAPI.filter((cafe) => {
    return !cafesSupabase.find((cafeSupabase) => cafeSupabase.id === cafe.id);
  });

  if (cafesToPush.length > 0) {
    const err = await PushNewCafesToSupabase(cafesToPush);
    if (err instanceof Error) {
      return err;
    }
  }

  return [...cafesSupabase, ...cafesToPush];
};

/**
 * V2 of search and filter places.
 * @param cafesSupabase
 * @param cafeRequest
 * @returns
 */
const searchAndFilterPlacesV2 = async (
  cafesSupabase: Cafe[],
  cafeRequest: CafeSearchRequest,
): Promise<CafeSearchResponse> => {
  const textSearchResponse = await TextSearchV2(cafeRequest);
  const results = textSearchResponse.data.results;

  const places: PlaceDataWithId[] = [];
  for (let i = 0; i < results.length; i++) {
    const place = results[i];
    if (!place.place_id) {
      return { cafes: [], error: 'place_id is required' };
    }
    const placeDetails = await GetPlaceDetails(place.place_id);
    places.push({ ...placeDetails.data.result, place_id: place.place_id });
  }

  const cafesPlacesAPI = CreateNewCafesFromPlaceData(places);
  if (cafesPlacesAPI instanceof Error) {
    return { cafes: [], error: cafesPlacesAPI.message };
  }

  const cafesToPush = cafesPlacesAPI.filter((cafe) => {
    return !cafesSupabase.find((cafeSupabase) => cafeSupabase.id === cafe.id);
  });
  let newCafes: Cafe[] = [];
  if (cafesToPush.length > 0) {
    const res = await PushNewCafesToSupabase(cafesToPush);
    if (res instanceof Error) {
      return { cafes: [], error: res.message };
    }
    newCafes = res;
  }

  return { cafes: [...cafesSupabase, ...newCafes], error: '' };
};

/**
 * Search cafes V2.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const searchCafesV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build our own Request object from the post request
    const cafeRequest: CafeSearchRequest = {
      query: req.body.query,
      radius: req.body.radius,
      location: req.body.location,
      geolocation: req.body.geolocation,
      openNow: req.body.openNow,
      tags: req.body.tags,
    };

    // We should do a textsearch under these parameters

    const cafesSupabase = await DynamicCafeQuery(cafeRequest);

    if (cafesSupabase instanceof Error) {
      res.status(400).json({ error: cafesSupabase.message });
      throw cafesSupabase;
    }

    const places = await searchAndFilterPlacesV2(cafesSupabase, cafeRequest);

    if (places.error) {
      res.status(400).json({ error: places.error });
      throw places.error;
    }

    res.json(places.cafes);
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred', message: error });
  }
};

export const searchCafesV3 = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build our own Request object from the post request
    const cafeRequest: CafeSearchRequest = {
      query: req.body.query,
      radius: req.body.radius,
      location: req.body.location,
      geolocation: req.body.geolocation,
      openNow: req.body.openNow,
      tags: req.body.tags,
    };

    // Run text search first, get places from Google Places API
    // Then we can uses the places id to query our supabase
    // get the cafes from supabase
    // and then check if tags are provided
    // if they are, return the cafes that match the tags
    // if not, return all cafes found under other parameters and also add the new cafes to supabase if found

    const textSearchResponse = await TextSearchV2(cafeRequest);
    const results = textSearchResponse.data.results;
    const places: PlaceDataWithId[] = [];
    for (let i = 0; i < results.length; i++) {
      const place = results[i];
      if (!place.place_id) {
        throw new Error('place_id is required');
      }
      const placeDetails = await GetPlaceDetails(place.place_id);
      places.push({ ...placeDetails.data.result, place_id: place.place_id });
    }

    const cafesFromPlaceData = CreateNewCafesFromPlaceData(places);
    if (cafesFromPlaceData instanceof Error) {
      res.status(400).json({ error: cafesFromPlaceData.message });
      throw cafesFromPlaceData;
    }

    const cafePlaceIds = cafesFromPlaceData.map((cafe) => cafe.id);

    const cafesSupabase = await GetCafesByIDAndQuery(cafePlaceIds, cafeRequest);

    if (cafesSupabase instanceof Error) {
      res.status(400).json({ error: cafesSupabase.message });
      throw cafesSupabase;
    }

    // Check if tags are provided
    if (cafeRequest.tags && cafeRequest.tags.length > 0) {
      // we already queried the cafes from supabase with the given tags
      res.json(cafesSupabase);
      return;
    }

    // If no tags are provided, we need to push the new cafes to supabase if we found any
    const cafesToPush = cafesFromPlaceData.filter((cafe) => {
      return !cafesSupabase.find((cafeSupabase) => cafeSupabase.id === cafe.id);
    });

    if (cafesToPush.length > 0) {
      const err = await PushNewCafesToSupabase(cafesToPush);
      if (err instanceof Error) {
        res.status(400).json({ error: err.message });
        throw err;
      }
    }

    res.json([...cafesSupabase, ...cafesToPush]);
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred', message: error });
  }
};
