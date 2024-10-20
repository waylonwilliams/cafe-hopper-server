import { Request, Response } from "express";
import { TextSearch, GetPlaceDetails } from "@/utils/maps/Places";
import {
  CreateNewCafesFromPlaceData,
  QueryCafesByName,
  PushNewCafesToSupabase,
} from "@/utils/supabase/Cafe";
import { PlaceDataWithId } from "@/utils/types";

/**
 * Search cafes using Google Places API and Supabase.
 * Queries cafes by name from Supabase and fills in missing cafes from Google Places.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const searchCafes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const name = req.params.name;

    const cafesSupabase = await QueryCafesByName(name);
    if (cafesSupabase instanceof Error) {
      res.status(400).json({ error: cafesSupabase.message });
      return;
    }

    const places = await searchAndFilterPlaces(name, cafesSupabase);
    if (places instanceof Error) {
      res.status(400).json({ error: places.message });
      return;
    }

    // Send the final response
    res.json(places);
  } catch (error) {
    // Catch any unexpected errors and send a 500 response
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

export const searchMaps = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const location = req.params.search;
    const places = await searchAndFilterPlaces(location);
    if (places instanceof Error) {
      res.status(400).json({ error: places.message });
    }
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

/**
 * Search and filter places.
 * @param {string} query - The search query.
 * @param {PlaceDataWithId[]} cafesSupabase - The cafes from Supabase.
 * @returns The cafes from Supabase and Google Places, or an error if there is one.
 */
const searchAndFilterPlaces = async (
  query: string,
  cafesSupabase: any[] = []
) => {
  const textSearchResponse = await TextSearch(query);
  const results = textSearchResponse.data.results;

  let places: PlaceDataWithId[] = [];
  for (let i = 0; i < results.length; i++) {
    const place = results[i];
    if (!place.place_id) {
      return new Error("place_id is required");
    }
    const placeDetails = await GetPlaceDetails(place.place_id);
    places.push({ ...placeDetails.data.result, place_id: place.place_id });
  }

  const cafesPlacesAPI = CreateNewCafesFromPlaceData(places);
  if (cafesPlacesAPI instanceof Error) {
    return cafesPlacesAPI;
  }

  let cafesToPush = cafesPlacesAPI.filter((cafe) => {
    return !cafesSupabase.find((cafeSupabase) => cafeSupabase.id === cafe.id);
  });

  if (cafesToPush.length > 0) {
    const err = await PushNewCafesToSupabase(cafesToPush);
    if (err) {
      return err;
    }
  }

  return [...cafesSupabase, ...cafesToPush];
};
