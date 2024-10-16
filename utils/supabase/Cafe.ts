import { serviceClient } from "./Client";
import { Cafe } from "../types";
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
