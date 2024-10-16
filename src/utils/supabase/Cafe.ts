import { serviceClient } from "./Client";
import { Cafe, PlaceDataWithId } from "../types";
import { PostgrestError } from "@supabase/supabase-js";

export async function PushCafesToSupabase(
  cafes: Cafe[]
): Promise<PostgrestError | undefined> {
  const supabase = serviceClient();

  const { error } = await supabase.from("Cafes").insert(cafes);

  // throw an error if there is one
  if (error) {
    return error;
  }
}

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
