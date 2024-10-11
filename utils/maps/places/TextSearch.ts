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
 */

export const TextSearch = (location: string): Promise<TextSearchResponse> => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  if (API_KEY === "") {
    throw new Error("API Key not set");
  }

  return MapsClient.textSearch({
    params: {
      location: "36.974117, -122.030792",
      radius: 5000,
      query: location,
      key: API_KEY,
      type: PlaceType1.cafe,
    },
  });
};
