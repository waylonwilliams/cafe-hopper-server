import { MapsClient } from "../client";

export default function GetPlacePhoto(photo_reference: string) {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  if (API_KEY === "") {
    throw new Error("API Key not set");
  }

  return MapsClient.placePhoto({
    params: {
      maxheight: 100,
      maxwidth: 100,
      photoreference: photo_reference,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
    },
    responseType: "arraybuffer",
  });
}
