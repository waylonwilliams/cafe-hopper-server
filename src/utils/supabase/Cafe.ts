/**
 * @name Cafe
 * @description
 * This file handles main logic for handling data from the Cafes table in Supabase.
 */
import { serviceClient } from '@/utils/supabase/Client';
import { Cafe, PlaceDataWithId, CafeSearchRequest } from '@types';

/**
 * @author Arveen Azhand
 * @name PushCafesToSupabase
 * @param cafes
 * @returns An error if there is one.
 * @description
 * Push cafes to Supabase.
 */
export async function PushNewCafesToSupabase(cafes: Cafe[]): Promise<Error | Cafe[]> {
  const supabase = serviceClient();

  const cafeIds = cafes.map((cafe) => cafe.id);

  const { data: existingCafes, error: existingCafesError } = await supabase
    .from('cafes')
    .select('id')
    .in('id', cafeIds);

  if (existingCafesError) {
    return new Error('Error when attempting to find existing cafes: ' + existingCafesError.message);
  }

  const existingCafeIds = existingCafes?.map((cafe) => cafe.id) || [];
  const newCafes = cafes.filter((cafe) => !existingCafeIds.includes(cafe.id));

  if (newCafes.length === 0) {
    return cafes;
  }

  const { error } = await supabase.from('cafes').insert(newCafes);

  // throw an error if there is one
  if (error) {
    return new Error('Error inserting cafes: ' + error.message);
  }

  return cafes;
}

/**
 * @author Arveen Azhand
 * @name CreateNewCafesFromPlaceData
 * @param places
 * @returns The cafes created from the place data, or an error if there is one.
 * @description
 * Create new cafes from place API data.
 */
export function CreateNewCafesFromPlaceData(places: PlaceDataWithId[]): Cafe[] | Error {
  const cafes: Cafe[] = [];
  places.forEach((place) => {
    if (!place.name) {
      return new Error('Name is required');
    }
    const cafe: Cafe = {
      id: place.place_id,
      title: place.name,
      address: place.formatted_address || 'No address found',
      latitude: place.geometry?.location.lat || 0, // should probably set this to a better number but will set it to 0 for now
      longitude: place.geometry?.location.lng || 0,
      hours:
        place.opening_hours?.weekday_text.join('\n').replace(/[ \u00A0\u2009\u202F]/g, '') || '', // get rid of all whitespace but preserve the newline characters
    };
    cafes.push(cafe);
  });

  return cafes;
}

/**
 * @author Arveen Azhand
 * @name QueryCafesByName
 * @param name - The name of the cafe to query.
 * @returns The cafes that match the name, or an error if there is one.
 * @description
 * Query cafes by name.
 * @example
 * const cafes = await QueryCafesByName("verve");
 */
export async function QueryCafesByName(name: string): Promise<Cafe[] | Error> {
  const supabase = serviceClient();

  const data = await supabase
    .from('cafes')
    .select('*')
    .ilike('title', `%${name}%`)
    .then((response) => {
      if (response.error) {
        return response.error;
      }
      return response.data;
    });

  if ('error' in data) {
    return new Error('Error querying cafes');
  }

  return data as Cafe[];
}

function getBoundingBox(lat: number, lng: number, radius: number) {
  const radiusInKm = radius / 1000;
  const radiusOfEarth = 6371;
  const angularDistance = radiusInKm / radiusOfEarth;
  const latInRadians = lat * (Math.PI / 180);
  const lngInRadians = lng * (Math.PI / 180);
  const minLat = latInRadians - angularDistance;
  const maxLat = latInRadians + angularDistance;
  const minLng = lngInRadians - angularDistance;
  const maxLng = lngInRadians + angularDistance;
  const minLatInDegrees = minLat * (180 / Math.PI);
  const maxLatInDegrees = maxLat * (180 / Math.PI);
  const minLngInDegrees = minLng * (180 / Math.PI);
  const maxLngInDegrees = maxLng * (180 / Math.PI);

  return {
    minLat: minLatInDegrees,
    maxLat: maxLatInDegrees,
    minLng: minLngInDegrees,
    maxLng: maxLngInDegrees,
  };
}

export function calculateDistance(
  userLocation: { lat: number; lng: number },
  cafeLocation: { lat: number; lng: number },
): number {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = userLocation.lat;
  const lon1 = userLocation.lng;
  const lat2 = cafeLocation.lat;
  const lon2 = cafeLocation.lng;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    0.5 -
    Math.cos(dLat) / 2 +
    (Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * (1 - Math.cos(dLon))) /
      2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * @name GetCafesByIDAndQuery
 * @param ids - The ids of the cafes to query.
 * @param req - The request object.
 * @returns The cafes that match the query, or an error if there is one.
 * @description
 *
 * Get cafes by id and query.
 */
export async function GetCafesByIDAndQuery(
  ids: string[],
  req: CafeSearchRequest,
): Promise<Cafe[] | Error> {
  const supabase = serviceClient();

  const { query, geolocation, radius, tags, sortBy, rating } = req;

  // dynamic query based on the request
  let cafesQuery = supabase.from('cafes').select('*').in('id', ids);

  if (query) {
    cafesQuery = cafesQuery.ilike('title', `%${query}%`);
  }

  if (geolocation && radius) {
    const { lat, lng } = geolocation;
    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radius);

    cafesQuery = cafesQuery
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng);
  }

  //   if (location) {
  //     cafesQuery = cafesQuery.ilike('address', `%${location}%`);
  //   }

  if (tags && tags.length > 0) {
    cafesQuery = cafesQuery.contains('tags', tags);
  }

  if (rating) {
    cafesQuery = cafesQuery.gte('rating', rating);
  }

  const { data, error } = await cafesQuery;

  if (error) {
    return new Error('Error querying cafes');
  }

  if (sortBy === 'distance') {
    // sort by distance
    const userLocation = geolocation;
    if (userLocation) {
      const sortedCafes = data?.sort((a, b) => {
        const cafeALocation = { lat: a.latitude, lng: a.longitude };
        const cafeBLocation = { lat: b.latitude, lng: b.longitude };
        const distanceA = calculateDistance(userLocation, cafeALocation);
        const distanceB = calculateDistance(userLocation, cafeBLocation);
        return distanceA - distanceB;
      });

      return sortedCafes as Cafe[];
    }
  } else {
    // sort by relevance
    const sortedCafes = data?.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      const lowerCaseQuery = query?.toLowerCase();
      const titleAMatch = titleA.includes(lowerCaseQuery || '');
      const titleBMatch = titleB.includes(lowerCaseQuery || '');
      if (titleAMatch && !titleBMatch) {
        return -1;
      }
      if (!titleAMatch && titleBMatch) {
        return 1;
      }
      return 0;
    });

    return sortedCafes as Cafe[];
  }

  return data as Cafe[];
}
