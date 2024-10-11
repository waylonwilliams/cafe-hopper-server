import express, { Request, Response } from "express";
import { Client, PlaceType1, LatLng } from "@googlemaps/google-maps-services-js";
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

    const client = new Client({});

    client.textSearch({
        params: {
            location: "36.974117, -122.030792",
            radius: 5000,
            query: location,
            type: PlaceType1.cafe,
            key: API_KEY,
        }
    }).then((r) => {
        res.send(r.data.results);
    }
    ).catch((e) => {
        res.send(e);
    });
});

