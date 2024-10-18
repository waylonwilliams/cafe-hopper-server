import express, { Request, Response } from "express";
import { TextSearch, GetPlaceDetails } from "@/utils/maps/Places";
import {
  PushCafesToSupabase,
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

  const err = await PushCafesToSupabase(cafes);

  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.json(cafes);
});

app.get("/cafes/search/:name", async (req: Request, res: Response) => {
  const name = req.params.name;

  const cafes = await QueryCafesByName(name);

  // cases:
  // if error, return 400
  // if no cafes, handle that
  // if cafes, return them

  if (cafes instanceof Error) {
    res.status(400).json({ error: cafes.message });
    return;
  }

  if (cafes.length === 0) {
    // no cafes found, lets use places api to find some
    // and then return them
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

    const cafes = CreateNewCafesFromPlaceData(places);

    if (cafes instanceof Error) {
      res.status(400).json({ error: cafes.message });
      return;
    }

    const err = await PushCafesToSupabase(cafes);

    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    res.json(cafes);
    return;
  }

  res.json(cafes);
});
