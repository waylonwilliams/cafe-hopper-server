import { MapsClient } from "../client";
import type { TextSearchResponse } from "@googlemaps/google-maps-services-js";
import { PlaceType1 } from "@googlemaps/google-maps-services-js";

/**
 * @name TextSearch
 * @description
 * The Google Maps Text Search API.
 *
 * @example
 * import { TextSearch } from "./utils/maps/places/TextSearch";
 *
 * @param query - The search query.
 * @param geolocation - The geolocation of the user (or some predefined location).
 */

export const TextSearch = (
  query: string,
  geolocation?: string
): Promise<TextSearchResponse> => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  if (API_KEY === "") {
    throw new Error("API Key not set");
  }

  return MapsClient.textSearch({
    params: {
      location: geolocation || "36.974117, -122.030792", // santa cruz geolocation but we can change this later
      radius: 5000,
      query: query,
      key: API_KEY,
      type: PlaceType1.cafe,
    },
  });
};

// Potential ideas for grabbing info:
// Grab the image data from these places and place them in supabase for now.
// Grab some reviews for some data, or we can just make up some reviews.
