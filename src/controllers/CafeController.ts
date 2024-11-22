import { Request, Response } from 'express';
import PlacesAPI from '@/utils/googlemaps/Places';
import {
  CreateNewCafesFromPlaceData,
  PushNewCafesToSupabase,
  GetCafesByIDAndQuery,
  calculateDistance,
} from '@/utils/supabase/Cafe';
import { PlaceDataWithId, CafeSearchRequest, CafeSearchResponse } from '@/utils/types';

/**
 * searchForCafes. This is the main logic behind the cafe search functionality.
 * @description
 * This version leverages Google Maps Places API **first** for their versatile searching capabilities.
 * We will use the places_id to query our Supabase database for cafes.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
export const searchForCafes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build our own Request object from the post request
    // Not every field is needed, but some minimal fields are required to function.
    // In other words, at least one of the following fields is required:
    if (
      !req.body.query &&
      !req.body.radius &&
      !req.body.location &&
      !req.body.geolocation &&
      !req.body.openNow &&
      !req.body.tags
    ) {
      res.status(400).json({ error: 'No search options provided' });
      return;
    }

    // check if valid geolocation is provided
    if (req.body.geolocation && (!req.body.geolocation.lat || !req.body.geolocation.lng)) {
      res.status(400).json({ error: 'geolocation must have lat and lng' });
      return;
    }

    // check if a valid sortBy is provided
    if (req.body.sortBy && !['distance', 'relevance'].includes(req.body.sortBy)) {
      res.status(400).json({ error: 'sortBy must be either distance or relevance' });
      return;
    }

    // build the request object
    const cafeRequest: CafeSearchRequest = {
      query: req.body.query,
      radius: req.body.radius,
      geolocation: req.body.geolocation,
      openNow: req.body.openNow,
      tags: req.body.tags,
      sortBy: req.body.sortBy,
      customTime: req.body.customTime,
      rating: req.body.rating,
    };

    // Get basic place data from TextSearch.
    const textSearchResponse = await PlacesAPI.TextSearch(cafeRequest);
    const textSearchResults = textSearchResponse.data.results;
    // TextSearch does not give us all the info we want.
    let detailedPlacesWithIDs: PlaceDataWithId[] = [];

    // get detailed information about each place
    for (let i = 0; i < textSearchResults.length; i++) {
      const place = textSearchResults[i];
      if (!place.place_id) {
        throw new Error('place_id is required');
      }
      // We get Place Details by calling the Google Places API using the IDs we get.
      const placeDetails = await PlacesAPI.GetPlaceDetailsByID(place.place_id);
      detailedPlacesWithIDs.push({ ...placeDetails.data.result, place_id: place.place_id });
    }

    // if a custom time is provided, filter the places by time
    if (cafeRequest.customTime) {
      const { customTime } = cafeRequest;
      const day = customTime.day || new Date().getDay();
      const time = customTime.time || '0000';
      // Set up arguments for the filter function
      const filteredPlaces = PlacesAPI.FilterPlacesByTime(detailedPlacesWithIDs, time, day);
      detailedPlacesWithIDs = filteredPlaces;
    }

    // if no places are found, return an empty array
    if (detailedPlacesWithIDs.length === 0) {
      res.status(200).json([]);
      return;
    }

    // create new Cafe objects from the place data
    const cafesFromPlaceData = CreateNewCafesFromPlaceData(detailedPlacesWithIDs);
    if (cafesFromPlaceData instanceof Error) {
      res.status(400).json({ error: cafesFromPlaceData.message });
      throw cafesFromPlaceData;
    }

    // get the Place IDs of the Place data to query Supabase
    const cafePlaceIds = cafesFromPlaceData.map((cafe) => cafe.id);

    const cafesSupabase = await GetCafesByIDAndQuery(cafePlaceIds, cafeRequest);

    if (cafesSupabase instanceof Error) {
      res.status(400).json({ error: cafesSupabase.message });
      throw cafesSupabase;
    }

    // Check if tags are provided in the request body
    if (cafeRequest.tags && cafeRequest.tags.length > 0) {
      // we already queried the cafes from supabase with the given tags
      // and since tags are only on cafes in the database, we
      // can return the cafes right now.
      res.json(cafesSupabase);
      return;
    }

    // If no tags are provided, we need to push the new cafes to supabase if we found any
    const cafesToPush = cafesFromPlaceData.filter((cafe) => {
      return !cafesSupabase.find((cafeSupabase) => cafeSupabase.id === cafe.id);
    });

    if (cafesToPush.length > 0) {
      const err = await PushNewCafesToSupabase(cafesToPush);
      if (err instanceof Error) {
        res.status(400).json({ error: err.message });
        throw err;
      }
    }

    const searchResponse: CafeSearchResponse = {
      cafes: [...cafesSupabase, ...cafesToPush],
      error: '',
    };

    // Sort the response based on the sortBy parameter again if we found new cafes
    const { sortBy, geolocation, query } = cafeRequest;
    if (sortBy === 'distance') {
      const userLocation = geolocation;
      if (userLocation) {
        searchResponse.cafes.sort((a, b) => {
          const cafeALocation = { lat: a.latitude, lng: a.longitude };
          const cafeBLocation = { lat: b.latitude, lng: b.longitude };
          const distanceA = calculateDistance(userLocation, cafeALocation);
          const distanceB = calculateDistance(userLocation, cafeBLocation);
          return distanceA - distanceB;
        });
      }
    }

    if (sortBy === 'relevance') {
      const lowerCaseQuery = query?.toLowerCase();
      searchResponse.cafes.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
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
    }

    res.json(searchResponse);
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred', message: error });
  }
};
