import express, { Request, Response } from "express";
import { TextSearch, GetPlaceDetails } from "@/utils/maps/Places";
import {
  PushNewCafesToSupabase,
  CreateNewCafesFromPlaceData,
  QueryCafesByName,
} from "@/utils/supabase/Cafe";
import { PlaceDataWithId } from "@/utils/types";
import { TextSearchResponse } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Cafe Hopper Server listening at http://localhost:${PORT}`);
});

/**
 * @name /maps/:search
 * @description
 * The endpoint for searching for cafes on Google Maps using Places API.
 * This is likely not to be used in production, but it's a good way to test
 */
app.get("/maps/:search", async (req: Request, res: Response) => {
  const location = req.params.search;

  let places: PlaceDataWithId[] = [];

  const textSearchResponse: TextSearchResponse = await TextSearch(location);

  const results = textSearchResponse.data.results;

  // We want the following fields for cafes:
  // Title,
  // Address,
  // Latitude, Longitude,
  // Hours

  for (let i = 0; i < results.length; i++) {
    const place = results[i];
    if (!place.place_id) {
      res.status(400).json({ error: "place_id is required" });
      return;
    }
    const placeDetails = await GetPlaceDetails(place.place_id);
    places.push({ ...placeDetails.data.result, place_id: place.place_id });
  }

  const cafes = CreateNewCafesFromPlaceData(places);

  if (cafes instanceof Error) {
    res.status(400).json({ error: cafes.message });
    return;
  }

  const err = await PushNewCafesToSupabase(cafes);

  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.json(cafes);
});

/**
 * @name /cafes/search/:name
 * @description
 * The endpoint for searching for cafes on Google Maps using Places API and Supabase.
 * Whatever is not in Supabase will be pushed to Supabase and returned to the client.
 * This is probably what we will use.
 */
app.get("/cafes/search/:name", async (req: Request, res: Response) => {
  const name = req.params.name;

  const cafesSupabase = await QueryCafesByName(name);

  if (cafesSupabase instanceof Error) {
    res.status(400).json({ error: cafesSupabase.message });
    return;
  }

  const textSearchResponse: TextSearchResponse = await TextSearch(name);
  const results = textSearchResponse.data.results;
  let places: PlaceDataWithId[] = [];
  for (let i = 0; i < results.length; i++) {
    const place = results[i];
    if (!place.place_id) {
      res.status(400).json({ error: "place_id is required" });
      return;
    }
    const placeDetails = await GetPlaceDetails(place.place_id);
    places.push({ ...placeDetails.data.result, place_id: place.place_id });
  }

  const cafesPlacesAPI = CreateNewCafesFromPlaceData(places);

  if (cafesPlacesAPI instanceof Error) {
    res.status(400).json({ error: cafesPlacesAPI.message });
    return;
  }

  // set A = { set of cafes from places api }
  // set B = { set of cafes from supabase }
  // set C = A - B
  // push C to supabase, return A + C

  // We want to push all the cafes in set A that are not in set B to supabase
  let cafesToPush = cafesPlacesAPI.filter((cafe) => {
    return !cafesSupabase.find((cafeSupabase) => cafeSupabase.id === cafe.id);
  });

  if (cafesToPush.length === 0) {
    res.json(cafesSupabase);
    return;
  }

  const err = await PushNewCafesToSupabase(cafesToPush);

  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.json([...cafesSupabase, ...cafesToPush]);
});
