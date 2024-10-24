import { MapsClient } from "@/utils/maps/Client";
import type {
  PlaceDetailsResponse,
  PlacePhotoResponse,
  PlacesNearbyResponse,
  TextSearchResponse,
} from "@googlemaps/google-maps-services-js";
import { PlaceType1 } from "@googlemaps/google-maps-services-js";

/**
 * @author Arveen Azhand
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
      radius: 1000,
      query: query,
      key: API_KEY,
      type: PlaceType1.cafe,
    },
  });
};

/**
 * @author Arveen Azhand
 * @name NearbySearch
 * @description
 * The Google Maps Nearby Search API.
 *
 * @example
 * import { NearbySearch } from "./utils/maps/places/NearbySearch";
 *
 * @param location - The location of the user.
 * @param radius - The radius of the search.
 */
export const NearbySearch = (
  location: string,
  radius: number
): Promise<PlacesNearbyResponse> => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  if (API_KEY === "") {
    throw new Error("API Key not set");
  }

  return MapsClient.placesNearby({
    params: {
      location: location,
      radius: radius,
      key: API_KEY,
      type: PlaceType1.cafe,
    },
  });
};

// Potential ideas for grabbing info:
// Grab the image data from these places and place them in supabase for now.
// Grab some reviews for some data, or we can just make up some reviews.

/**
 * @author Arveen Azhand
 * @name GetPlacePhoto
 * @description
 * The Google Maps Place Photo API.
 *
 * @example
 * import { GetPlacePhoto } from "./utils/maps/places/GetPlacePhoto";
 *
 * @param photo_reference - The photo reference.
 */
export const GetPlacePhoto = (
  photo_reference: string
): Promise<PlacePhotoResponse> => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  if (API_KEY === "") {
    throw new Error("API Key not set");
  }

  return MapsClient.placePhoto({
    params: {
      maxheight: 100,
      maxwidth: 100,
      photoreference: photo_reference,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
    },
    responseType: "arraybuffer",
  });
};

/**
 * @author Arveen Azhand
 * @name GetPlaceDetails
 * @description
 * The Google Maps Place Details API.
 *
 * @example
 * import { GetPlaceDetails } from "./utils/maps/places/GetPlaceDetails";
 *
 * @param place_id - The place ID.
 */
export const GetPlaceDetails = (
  place_id: string | undefined
): Promise<PlaceDetailsResponse> => {
  if (!place_id) {
    throw new Error("Place ID not set");
  }
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  if (API_KEY === "") {
    throw new Error("API Key not set");
  }

  return MapsClient.placeDetails({
    params: {
      place_id: place_id,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
      fields: [
        "opening_hours/weekday_text",
        "name",
        "formatted_address",
        "geometry",
        "icon_mask_base_uri",
      ],
    },
  });
};
