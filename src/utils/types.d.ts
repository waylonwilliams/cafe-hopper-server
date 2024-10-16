/**
 * utils/types.d.ts holds our type definitions for CafeHopper.
 * We can change these as our project grows.
 */

import { PlaceData } from "@googlemaps/google-maps-services-js";

/**
 *
 * @name Cafe
 * @description
 * The Cafe type.
 *
 * @example
 * import { Cafe } from "./utils/types";
 **/
export type Cafe = {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  hours: string;
};

/**
 *
 * @name PlaceDataWithId
 * @description
 * The PlaceDataWithId type, basically just PlaceData but with the place_id for supabase.
 *
 * @example
 * import { PlaceDataWithId } from "./utils/types";
 **/
export type PlaceDataWithId = {
  place_id: string;
} & Partial<PlaceData>;
