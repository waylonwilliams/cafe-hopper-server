import { Request, Response } from 'express';
import PlacesAPI from '@/utils/googlemaps/Places';
import CafeModel from '@/utils/supabase/Cafe';
import { PlaceDataWithId, CafeSearchRequest, CafeSearchResponse } from '@/utils/types';

/**
 * @name searchForCafes. This is the main logic behind the cafe search functionality.
 * @description
 * This function leverages Google Maps Places API TextSearch **first** for their versatile searching capabilities.
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
      const response: CafeSearchResponse = {
        cafes: [],
        error:
          'At least one of the following fields is required: query, radius, location, geolocation, openNow, tags',
      };
      res.status(400).json(response);
      return;
    }

    // check if valid geolocation is provided
    if (req.body.geolocation && (!req.body.geolocation.lat || !req.body.geolocation.lng)) {
      const response: CafeSearchResponse = {
        cafes: [],
        error: 'geolocation must have lat and lng',
      };
      res.status(400).json(response);
    }

    // check if a valid sortBy is provided
    if (req.body.sortBy && !['distance', 'relevance'].includes(req.body.sortBy)) {
      const response: CafeSearchResponse = {
        cafes: [],
        error: 'sortBy must be set to either distance or relevance if provided',
      };
      res.status(400).json(response);
      return;
    }

    // build the request object
    const cafeRequest: CafeSearchRequest = {
      query: req.body.query,
      radius: req.body.radius || 1000,
      geolocation: req.body.geolocation,
      openNow: req.body.openNow,
      tags: req.body.tags,
      sortBy: req.body.sortBy,
      customTime: req.body.customTime,
      rating: req.body.rating,
    };

    // Get basic place data from TextSearch.
    const textSearchResponse = await PlacesAPI.textSearch(cafeRequest);
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
      const placeDetails = await PlacesAPI.getPlaceDetailsByID(place.place_id);
      detailedPlacesWithIDs.push({ ...placeDetails.data.result, place_id: place.place_id });
    }

    // if a custom time is provided, filter the places by time
    if (cafeRequest.customTime) {
      const { customTime } = cafeRequest;
      // Make sure types of day and time are correct
      if (
        customTime.day !== undefined &&
        (typeof customTime.day !== 'number' || customTime.day < 0 || customTime.day > 6)
      ) {
        const response: CafeSearchResponse = {
          cafes: [],
          error: 'day must be a number between 0 and 6',
        };
        res.status(400).json(response);
        return;
      }
      if (
        customTime.time !== undefined &&
        (typeof customTime.time !== 'string' || !/^\d{4}$/.test(customTime.time))
      ) {
        const response: CafeSearchResponse = {
          cafes: [],
          error: 'time must be a string in the format HHMM',
        };
        res.status(400).json(response);
        return;
      }
      const day = customTime.day || new Date().getDay();
      const time = customTime.time || '0000';
      // Set up arguments for the filter function
      const filteredPlaces = PlacesAPI.filterPlacesByTime(detailedPlacesWithIDs, time, day);
      detailedPlacesWithIDs = filteredPlaces;
    }

    // if no places are found, return no cafes
    if (detailedPlacesWithIDs.length === 0) {
      const response: CafeSearchResponse = {
        cafes: [],
        error: '',
      };
      res.status(200).json(response);
      return;
    }

    // create new Cafe objects from the place data
    const cafesFromPlaceData = CafeModel.createNewCafesFromPlaceData(detailedPlacesWithIDs);
    if (cafesFromPlaceData instanceof Error) {
      throw cafesFromPlaceData;
    }

    // get the Place IDs of the Place data to query Supabase
    const cafePlaceIds = cafesFromPlaceData.map((cafe) => cafe.id);

    const cafesFromSupabase = await CafeModel.getCafesByIDAndQuery(cafePlaceIds, cafeRequest);

    if (cafesFromSupabase instanceof Error) {
      throw cafesFromSupabase;
    }

    // Check if tags are provided in the request body
    if (cafeRequest.tags && cafeRequest.tags.length > 0) {
      // we already queried the cafes from supabase with the given tags
      // and since tags are only on cafes in the database, we
      // can return the cafes right now.
      const response: CafeSearchResponse = {
        cafes: cafesFromSupabase,
        error: '',
      };
      res.json(response);
      return;
    }

    // If no tags are provided, we need to push the new cafes to supabase if we found any
    const cafesToPush = cafesFromPlaceData.filter((cafe) => {
      return !cafesFromSupabase.find((cafeSupabase) => cafeSupabase.id === cafe.id);
    });

    const searchResponse: CafeSearchResponse = {
      cafes: [...cafesFromSupabase, ...cafesToPush],
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
          const distanceA = CafeModel.helpers.calculateDistance(userLocation, cafeALocation);
          const distanceB = CafeModel.helpers.calculateDistance(userLocation, cafeBLocation);
          return distanceA - distanceB;
        });
      }
    }

    if (sortBy === 'relevance') {
      const lowerCaseQuery = query?.toLowerCase();
      searchResponse.cafes.sort((a, b) => {
        const titleA = a.name.toLowerCase();
        const titleB = b.name.toLowerCase();
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

    // After sending the response, push the new cafes to supabase
    if (cafesToPush.length > 0) {
      const err = await CafeModel.pushNewCafesToSupabase(cafesToPush);
      if (err instanceof Error) {
        console.log(err);
        // throwing an error here would mean the user gets an error for something
        // out of their control, so we should just log it.
        return;
      }
    }
  } catch (error) {
    console.log(error);
    if (res.headersSent) {
      return;
    }
    const response: CafeSearchResponse = {
      cafes: [],
      error: 'An error occurred while searching for cafes',
    };
    res.status(500).json(response);
  }
};
