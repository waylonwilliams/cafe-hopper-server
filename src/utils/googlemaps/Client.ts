import { Client } from '@googlemaps/google-maps-services-js';

/**
 * @name MapsClient
 * @description
 * The Google Maps client.
 *
 * With the new library they want users to
 * pass in the API key in the request object, rather than
 * instantiating the client with the API key.
 *
 * @example
 * import { MapsClient } from "./utils/maps/client";
 */
export const MapsClient = new Client({});
