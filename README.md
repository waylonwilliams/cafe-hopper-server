# cafe-hopper-server

```sh
npm i
npm run start
```

## Types

We have a few types that are used throughout the application, and there will be more added soon.
I would look at utils/types.d.ts if you are confused about anything written here.

### Cafe

```typescript
type Cafe = {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  hours: string;
  tags?: string[];
  created_at?: string;
  image?: string;
  num_reviews?: number;
  rating?: number;
};
```

Cafe is just a type that represents the Cafe schema in Supabase. As we add/remove columns from the table, we should remember to update the type fields accordingly.

- id: string - The unique identifier for the cafe.
- title: string - The name of the cafe.
- address: string - The address of the cafe.
- latitude: number - The latitude of the cafe.
- longitude: number - The longitude of the cafe.
- hours: string - The hours of the cafe, this will be a string in a format `Day:XX:XX-XX:XX\nDay:XX:XX-XX:XX\n...` where `Day` is the day of the week and `XX:XX-XX:XX` is the opening and closing time for that day. You can parse this string by splitting on `\n` and then splitting on `:` to get the day and time.

### CafeSearchRequest

```typescript
type CafeSearchRequest = {
  query?: string;
  radius?: number | 1000;
  geolocation?: {
    lat: number;
    lng: number;
  };
  openNow?: boolean | undefined;
  tags?: string[];
  sortBy?: 'relevance' | 'distance'; // could also sort by rating later
  customTime?: {
    day: number; // 0-6 where 0 is Sunday and 6 is Saturday
    time: string; // 'HHMM' in 24 hour format, ex: 2000 for 8:00 PM
  };
};
```

These will be the options that we can set for the user, and will be sent to the backend to figure out what cafes to return. Note that sortBy can be either 'relevance' or 'distance'. If it is 'relevance', then we will sort by the relevance of the query. If it is 'distance', then we will sort by the distance from the user's location.

## Routes

**_POST_** '/cafes/search'

- **Query Params**
  - 'query' - The search query that the user is looking for, could be name, address, etc..
  - 'radius' - The radius in meters that the user is looking for.
  - 'geolocation' - The geolocation that the user is looking for. See CafeSearchRequest for more information.
  - 'openNow' - Whether the cafe is open now or not.
  - 'tags' - The tags that the user is looking for.
  - 'sortBy' - The way that the user wants to sort the cafes. See CafeSearchRequest for more information.
  - 'customTime' - The custom time that the user is looking for. See CafeSearchRequest for more information.

Note: Query is similar to how you would search something up in Google Maps or Yelp. (it could be like 'cafes near me' or just a simple name search) The reason for this is because we are actually going to be passing in the query in the TextSearch function provided by the Places API. So in a search bar on the frontend, you would typically put whatever is in the search bar in the query field. On a search method like on a map, the query automatically becomes "cafe" (handled here already) and you would just handle the rest of the fields.

## Examples

Request body:

```json
{
  "radius": 1000,
  "query": "cypress coffee",
  "sortBy": "relevance",
  "customTime": {
    "day": 2,
    "time": "0700"
  }
}
```

Response:

```json
[
  {
    "id": "ChIJW_SeZ09zkFQR3M5g1R01NJ4",
    "created_at": "2024-10-26T20:09:30.717376+00:00",
    "title": "Cypress Coffee Company",
    "hours": "Monday:6:00AM–4:00PM\nTuesday:6:00AM–4:00PM\nWednesday:6:00AM–4:00PM\nThursday:6:00AM–4:00PM\nFriday:6:00AM–4:00PM\nSaturday:7:00AM–4:00PM\nSunday:7:00AM–1:00PM",
    "latitude": 47.6944167,
    "longitude": -122.0425667,
    "address": "22310 NE Marketplace Dr # 102, Redmond, WA 98053, USA",
    "tags": null,
    "image": null,
    "summary": null,
    "rating": 10,
    "num_reviews": 0
  }
]
```

Another request:

```json
{
  "radius": 1000,
  "query": "verve",
  "sortBy": "relevance",
  "customTime": {
    "day": 2,
    "time": "0700"
  },
  "geolocation": {
    // geolocation of santa cruz, ca
    "lat": 36.974117,
    "lng": -122.030792
  }
}
```

Response:

```json
[
    {
        "id": "ChIJ2xDn9iVAjoARFidiiMHCE4g",
        "created_at": "2024-10-25T22:01:32.939706+00:00",
        "title": "Verve Coffee Roasters",
        "hours": "Monday:7:00AM–6:00PM\nTuesday:7:00AM–6:00PM\nWednesday:7:00AM–6:00PM\nThursday:7:00AM–6:00PM\nFriday:7:00AM–6:00PM\nSaturday:7:00AM–6:00PM\nSunday:7:00AM–6:00PM",
        "latitude": 36.97624820000001,
        "longitude": -122.0267099,
        "address": "1540 Pacific Ave, Santa Cruz, CA 95062, USA",
        "tags": null,
        "image": null,
        "summary": null,
        "rating": 10,
        "num_reviews": 0
    },
    {
        "id": "ChIJc78V6ntqjoARVaQzxb6Pr7c",
        "title": "Verve Coffee Roasters",
        "address": "1010 Fair Ave, Santa Cruz, CA 95060, USA",
        "latitude": 36.95904220000001,
        "longitude": -122.045634,
        "hours": "Monday:7:00AM–6:00PM\nTuesday:7:00AM–6:00PM\nWednesday:7:00AM–6:00PM\nThursday:7:00AM–6:00PM\nFriday:7:00AM–6:00PM\nSaturday:7:00AM–6:00PM\nSunday:7:00AM–6:00PM"
    },
    {
        "id": "ChIJO8LPsRYVjoAR3m0kVqfBEho",
        "title": "Verve Coffee Roasters",
        "address": "104 Bronson St #19, Santa Cruz, CA 95062, USA",
        "latitude": 36.9686546,
        "longitude": -122.006444,
        "hours": "Monday:7:00AM–5:00PM\nTuesday:7:00AM–5:00PM\nWednesday:7:00AM–5:00PM\nThursday:7:00AM–5:00PM\nFriday:7:00AM–5:00PM\nSaturday:7:00AM–5:00PM\nSunday:7:00AM–5:00PM"
    }, ...
]
```

Here is an example of how I plan to use the tags (it's pretty simple):

```typescript
const cafeRequest: CafeSearchRequest = {
  query: req.body.query,
  radius: req.body.radius,
  geolocation: req.body.geolocation,
  openNow: req.body.openNow,
  tags: req.body.tags,
  sortBy: req.body.sortBy,
  customTime: req.body.customTime,
};
```

- **Response**
  - 200 - Returns an array of Cafe objects that match the search query. I would look at the Cafe type for more information.
  - 400 - Returns an error message if the query is invalid.
