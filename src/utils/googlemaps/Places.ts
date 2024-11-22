import { MapsClient } from '@/utils/googlemaps/Client';
import type { PlaceDetailsResponse, TextSearchResponse } from '@googlemaps/google-maps-services-js';
import { PlaceType1 } from '@googlemaps/google-maps-services-js';
import { CafeSearchRequest, PlaceDataWithId } from '@/utils/types';

/**
 * @name TextSearch
 * @description
 * The Google Maps Text Search API.
 *
 * @param cafeSearchReq - The cafe search request.
 */
export const TextSearch = (cafeSearchReq: CafeSearchRequest): Promise<TextSearchResponse> => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  if (API_KEY === '') {
    throw new Error('API Key not set');
  }

  // const location = // lat, lng
  const location = `${cafeSearchReq.geolocation?.lat},${cafeSearchReq.geolocation?.lng}`;

  return MapsClient.textSearch({
    params: {
      location: location,
      radius: cafeSearchReq.radius || 500,
      query: cafeSearchReq.query || 'cafe', // default to cafe if no query set explicitly
      opennow: cafeSearchReq.openNow || undefined,
      key: API_KEY,
      type: PlaceType1.cafe,
    },
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
export const GetPlaceDetailsByID = (
  place_id: string | undefined,
): Promise<PlaceDetailsResponse> => {
  if (!place_id) {
    throw new Error('Place ID not set');
  }
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  if (API_KEY === '') {
    throw new Error('API Key not set');
  }

  return MapsClient.placeDetails({
    params: {
      place_id: place_id,
      key: process.env.GOOGLE_MAPS_API_KEY || '',
      fields: [
        'opening_hours/weekday_text',
        'opening_hours/periods',
        'name',
        'formatted_address',
        'geometry',
        'icon_mask_base_uri',
      ],
    },
  });
};

// helper function to convert time to minutes
function timeToMinutes(time: string | undefined): number {
  if (!time) {
    return 0;
  }
  const hours = parseInt(time.substring(0, 2), 10);
  const minutes = parseInt(time.substring(2), 10);
  return hours * 60 + minutes;
}

/**
 * @name filterPlacesByTime
 * @description
 * Filters places by time.
 *
 * @param places - The places to filter.
 * @param time - The time to filter by.
 * @param day - The day to filter by.
 */
export function FilterPlacesByTime(
  places: PlaceDataWithId[],
  time: string,
  day: number,
): PlaceDataWithId[] {
  const timeInMinutes = timeToMinutes(time);

  return places.filter((place) => {
    const openingHours = place.opening_hours?.periods || [];

    return openingHours.some((period) => {
      if (period.open?.day === day) {
        const openTime = timeToMinutes(period.open.time);
        const closeTime = timeToMinutes(period.close?.time);

        if (openTime === 0 || closeTime === 0) {
          return false;
        }

        if (openTime <= timeInMinutes && timeInMinutes <= closeTime) {
          return true;
        }

        if (openTime > closeTime && (openTime <= timeInMinutes || timeInMinutes <= closeTime)) {
          return true;
        }

        return false;
      }
      return false;
    });
  });
}

const PlacesAPI = {
  TextSearch,
  GetPlaceDetailsByID,
  FilterPlacesByTime,
};

export default PlacesAPI;
