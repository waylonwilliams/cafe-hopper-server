/**
 * utils/types.d.ts holds our type definitions for CafeHopper.
 * We can change these as our project grows.
 */

import { PlaceData } from '@googlemaps/google-maps-services-js';

/**
 *
 * @name Cafe
 * @description
 * The Cafe type.
 *
 * @example
 * import { Cafe } from "@/utils/types";
 **/
export type Cafe = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hours: string;
  tags?: string[];
  created_at?: string;
  image?: string;
  num_reviews?: number;
  rating?: number;
  summary?: string;
};

/**
 *
 * @name PlaceDataWithId
 * @description
 * The PlaceDataWithId type, basically just PlaceData (from Google Maps Places API)
 * but with the place_id for querying Supabase.
 * @example
 * import { PlaceDataWithId } from "./utils/types";
 **/
export type PlaceDataWithId = {
  place_id: string;
} & Partial<PlaceData>;

/**
 * @name CafeSearchRequest
 * @description
 * The CafeSearchRequest type.
 *
 * @example
 * import { CafeSearchRequest } from "@/utils/types";
 */
export type CafeSearchRequest = {
  query?: string;
  radius?: number | 1000;
  geolocation?: {
    lat: number;
    lng: number;
  };
  openNow?: boolean | undefined;
  customTime?: {
    day?: number;
    time?: string;
  };
  tags?: string[];
  sortBy?: string;
  rating?: number;
};

/**
 * @name CafeSearchResponse
 * @description
 * The CafeSearchResponse type.
 *
 * @example
 * import { CafeSearchResponse } from "@/utils/types";
 */
export type CafeSearchResponse = {
  cafes: Cafe[];
  error: string;
};
