/**
 * utils/types.d.ts holds our type definitions for CafeHopper.
 * We can change these as our project grows.
 */

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
