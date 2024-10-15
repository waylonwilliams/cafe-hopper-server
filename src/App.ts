import express, { Request, Response } from "express";
import { TextSearch } from "../utils/maps/places/TextSearch";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log("Example app listening at http://localhost:3000");
});

app.get("/maps/:search", (req: Request, res: Response) => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  if (API_KEY === "") {
    res.send("API_KEY is not set");
    return;
  }

  const location = req.params.search;

  let places: any[] = [];

  TextSearch(location)
    .then((response) => {
      response.data.results.forEach((result) => {
        places.push({
          name: result.name,
          address: result.formatted_address,
          location: result.geometry?.location,
          rating: result.rating,
          open: result.opening_hours?.open_now,
          image: result.photos ? result.photos[0].photo_reference : null,
        });
      });
      res.json(places);
    })
    .catch((error) => {
      console.error(error);
      res.send("Error");
    });
});
