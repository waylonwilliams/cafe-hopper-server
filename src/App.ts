import express, { Request, Response } from "express";
import { TextSearch, GetPlaceDetails } from "@/utils/maps/Places";
import {
  PushCafesToSupabase,
  CreateNewCafesFromPlaceData,
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
  console.log("Example app listening at http://localhost:3000");
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

  await PushCafesToSupabase(cafes);

  res.json(cafes);
});
