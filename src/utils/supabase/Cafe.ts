import { serviceClient } from "./Client";
import { Cafe, PlaceDataWithId } from "../types";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * @author Arveen Azhand
 * @name PushCafesToSupabase
 * @param cafes
 * @returns An error if there is one.
 * @description
 * Push cafes to Supabase.
 */
export async function PushNewCafesToSupabase(
  cafes: Cafe[]
): Promise<PostgrestError | undefined> {
  const supabase = serviceClient();

  const cafeIds = cafes.map((cafe) => cafe.id);

  const { data: existingCafes, error: existingCafesError } = await supabase
    .from("Cafes")
    .select("id")
    .in("id", cafeIds);

  if (existingCafesError) {
    return existingCafesError;
  }

  const existingCafeIds = existingCafes?.map((cafe) => cafe.id) || [];
  const newCafes = cafes.filter((cafe) => !existingCafeIds.includes(cafe.id));

  if (newCafes.length === 0) {
    return;
  }

  const { error } = await supabase.from("Cafes").insert(newCafes);

  // throw an error if there is one
  if (error) {
    return error;
  }
}

/**
 * @author Arveen Azhand
 * @name CreateNewCafesFromPlaceData
 * @param places
 * @returns The cafes created from the place data, or an error if there is one.
 * @description
 * Create new cafes from place API data.
 */
export function CreateNewCafesFromPlaceData(
  places: PlaceDataWithId[]
): Cafe[] | Error {
  let cafes: Cafe[] = [];
  places.forEach((place) => {
    if (!place.name) {
      return new Error("Name is required");
    }
    const cafe: Cafe = {
      id: place.place_id,
      title: place.name,
      address: place.formatted_address || "No address found",
      latitude: place.geometry?.location.lat || 0, // should probably set this to a better number but will set it to 0 for now
      longitude: place.geometry?.location.lng || 0,
      hours:
        place.opening_hours?.weekday_text
          .join("\n")
          .replace(/[ \u00A0\u2009\u202F]/g, "") || "", // get rid of all whitespace but preserve the newline characters
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
    .from("Cafes")
    .select("*")
    .ilike("title", `%${name}%`)
    .then((response) => {
      if (response.error) {
        return response.error;
      }
      return response.data;
    });

  if ("error" in data) {
    return new Error("Error querying cafes");
  }

  return data as Cafe[];
}
