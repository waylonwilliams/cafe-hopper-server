import { serviceClient } from '@/utils/supabase/Client';
import { Cafe, PlaceDataWithId, CafeSearchRequest } from '@types';

/**
 * @author Arveen Azhand
 * @name pushCafesToSupabase
 * @param cafes
 * @returns An error if there is one.
 * @description
 * Push cafes to Supabase.
 */
export async function pushNewCafesToSupabase(cafes: Cafe[]): Promise<Error | Cafe[]> {
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
 * @name createNewCafesFromPlaceData
 * @param places
 * @returns The cafes created from the place data, or an error if there is one.
 * @description
 * Create new cafes from place API data.
 */
export function createNewCafesFromPlaceData(places: PlaceDataWithId[]): Cafe[] | Error {
  const cafes: Cafe[] = [];
  places.forEach((place) => {
    if (!place.name) {
      return new Error('Name is required');
    }

    // Pass in the basic information and initialize the rest of the fields to zero states.
    const cafe: Cafe = {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || 'No address found',
      latitude: place.geometry?.location.lat || 0,
      longitude: place.geometry?.location.lng || 0,
      hours:
        // get rid of all whitespace but preserve the newline characters
        place.opening_hours?.weekday_text.join('\n').replace(/[ \u00A0\u2009\u202F]/g, '') || '',
      tags: [],
      image: '',
      num_reviews: 0,
      rating: 0,
      summary: '',
    };
    cafes.push(cafe);
  });

  return cafes;
}

/**
 * @name calculateDistance
 * @param userLocation - The user's location.
 * @param cafeLocation - The cafe's location.
 * @returns The distance between the user and the cafe.
 * @description
 * Calculate the distance between the user and the cafe.
 */
function calculateDistance(
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
 * @name getCafesByIDAndQuery
 * @param ids - The ids of the cafes to fetch.
 * @param req - The request object.
 * @returns The cafes that match the query, or an error if there is one.
 * @description
 *
 * Get cafes by id and query.
 */
export async function getCafesByIDAndQuery(
  ids: string[],
  req: CafeSearchRequest,
): Promise<Cafe[] | Error> {
  const supabase = serviceClient();

  const { query, geolocation, tags, sortBy, rating } = req;

  // Whatever Place_ids that were received from Places API TextSearch, we use here.
  let cafesQuery = supabase.from('cafes').select('*').in('id', ids);

  // Filter by tags if provided
  if (tags && tags.length > 0) {
    cafesQuery = cafesQuery.contains('tags', tags);
  }

  // Filter by rating if provided
  if (rating) {
    cafesQuery = cafesQuery.gte('rating', rating);
  }

  // Fetch the cafes
  const { data, error } = await cafesQuery;

  if (error) {
    return new Error('Error querying cafes');
  }

  // And we also sort the cafes by distance or relevance if provided
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

      // make sure all fields of cafes are present
      return sortedCafes as Cafe[];
    }
  } else {
    // sort by relevance
    const sortedCafes = data?.sort((a, b) => {
      const titleA = a.name.toLowerCase();
      const titleB = b.name.toLowerCase();
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

const CafeModel = {
  pushNewCafesToSupabase,
  createNewCafesFromPlaceData,
  getCafesByIDAndQuery,
  helpers: {
    calculateDistance,
  },
};

export default CafeModel;
