import { mapsClient } from '@/utils/googlemaps/Client';
import type { PlaceDetailsResponse, TextSearchResponse } from '@googlemaps/google-maps-services-js';
import { PlaceType1 } from '@googlemaps/google-maps-services-js';
import { CafeSearchRequest, PlaceDataWithId } from '@/utils/types';

const detailFields = [
  'opening_hours/weekday_text',
  'opening_hours/periods',
  'name',
  'formatted_address',
  'geometry',
  'icon_mask_base_uri',
];

/**
 * @author Arveen Azhand
 * @name textSearch
 * @description
 * The Google Maps Text Search API.
 *
 * @param cafeSearchReq - The cafe search request.
 */
export const textSearch = (cafeSearchReq: CafeSearchRequest): Promise<TextSearchResponse> => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  if (API_KEY === '') {
    throw new Error('API Key not set');
  }

  const geolocation = `${cafeSearchReq.geolocation?.lat},${cafeSearchReq.geolocation?.lng}`;

  // Use the Google Maps Text Search API to search for cafes since they can
  // Handle the query parameters like radius, openNow, etc. already.
  return mapsClient.textSearch({
    params: {
      location: geolocation,
      radius: cafeSearchReq.radius,
      query: cafeSearchReq.query || 'cafe', // default to cafe if no query set explicitly
      opennow: cafeSearchReq.openNow || undefined,
      key: API_KEY,
      type: PlaceType1.cafe,
    },
  });
};

/**
 * @author Arveen Azhand
 * @name getPlaceDetails
 * @description
 * The Google Maps Place Details API.
 *
 * @param place_id - The place ID.
 */
export const getPlaceDetailsByID = (
  place_id: string | undefined,
): Promise<PlaceDetailsResponse> => {
  if (!place_id) {
    throw new Error('Place ID not set');
  }
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  if (API_KEY === '') {
    throw new Error('API Key not set');
  }

  return mapsClient.placeDetails({
    params: {
      place_id: place_id,
      key: process.env.GOOGLE_MAPS_API_KEY || '',
      fields: detailFields,
    },
  });
};

/**
 * @name timeToMinutes
 * @description
 * Helper function: Converts a time string to minutes.
 *
 * @param time - The time to convert.
 */
function timeToMinutes(time: string | undefined): number {
  if (!time) {
    return 0;
  }
  const hours = parseInt(time.substring(0, 2), 10);
  const minutes = parseInt(time.substring(2), 10);
  return hours * 60 + minutes;
}

/**
 * @author Arveen Azhand
 * @name filterPlacesByTime
 * @description
 * Filters places by time.
 *
 * @param places - The places to filter.
 * @param time - The time to filter by.
 * @param day - The day to filter by.
 */
export function filterPlacesByTime(
  places: PlaceDataWithId[],
  time: string,
  day: number,
): PlaceDataWithId[] {
  const timeInMinutes = time ? timeToMinutes(time) : null;

  return places.filter((place) => {
    const openingHours = place.opening_hours?.periods || [];

    return openingHours.some((period) => {
      const isDayMatch = day === undefined || period.open?.day === day;

      if (!isDayMatch) {
        return false;
      }

      // if no time is provided only check filter by day
      if (!timeInMinutes) {
        return true;
      }

      // if time is provided, check if the place is open at that time
      const openTime = timeToMinutes(period.open?.time);
      const closeTime = timeToMinutes(period.close?.time);

      // Handle normal open-close ranges
      if (openTime <= timeInMinutes && timeInMinutes <= closeTime) {
        return true;
      }

      // Handle overnight ranges (e.g., open at 10 PM and close at 2 AM)
      if (openTime > closeTime && (openTime <= timeInMinutes || timeInMinutes <= closeTime)) {
        return true;
      }

      return false;
    });
  });
}

const PlacesAPI = {
  textSearch,
  getPlaceDetailsByID,
  filterPlacesByTime,
};

export default PlacesAPI;
