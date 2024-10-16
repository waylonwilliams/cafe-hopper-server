import express, { Request, Response } from "express";
import { TextSearch, GetPlaceDetails } from "../utils/maps/Places";
import { PushCafesToSupabase } from "../utils/supabase/Cafe";
import { Cafe } from "../utils/types";
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

  let places: any[] = [];

  const textSearchResponse: TextSearchResponse = await TextSearch(location);

  const results = textSearchResponse.data.results;

  // We want the following fields for cafes:
  // Title,
  // Address,
  // Latitude, Longitude,
  // Hours

  for (let i = 0; i < results.length; i++) {
    const place = results[i];
    const placeDetails = await GetPlaceDetails(place.place_id);
    places.push({ ...placeDetails.data.result, place_id: place.place_id });
  }

  let cafes: Cafe[] = [];
  places.forEach((place) => {
    const cafe: Cafe = {
      id: place.place_id,
      title: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      hours: place.opening_hours?.weekday_text
        .join("\n")
        .replace(/[ \u00A0\u2009\u202F]/g, ""), // get rid of all whitespace but preserve the newline characters
    };
    cafes.push(cafe);
  });

  await PushCafesToSupabase(cafes);

  res.json(cafes);
});
