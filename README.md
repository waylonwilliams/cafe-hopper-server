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
  tags: string[];
  created_at: string;
};
```

Cafe is just a type that represents the Cafe schema in Supabase. As we add/remove columns from the table, we should remember to update the type fields accordingly.

id: string - The unique identifier for the cafe.
title: string - The name of the cafe.
address: string - The address of the cafe.
latitude: number - The latitude of the cafe.
longitude: number - The longitude of the cafe.
hours: string - The hours of the cafe, this will be a string in a format Day:XX:XX-XX:XX\nDay:XX:XX-XX:XX\n... where Day is the day of the week and XX:XX-XX:XX is the opening and closing time for that day. You can parse this string by splitting on \n and then splitting on : to get the day and time.

### CafeSearchRequest

```typescript
type CafeSearchRequest = {
  query?: string;
  radius?: number | 1000;
  location?: string;
  geolocation?: {
    lat: number;
    lng: number;
  };
  openNow?: boolean | undefined;
  tags?: string[];
};
```

These will be the options that we can set for the user, and will be sent to the backend to figure out what cafes to return.

## Routes

**_POST_** '/cafes/search'

- **Query Params**
  - 'query' - The search query that the user is looking for, could be name, address, etc..
  - 'radius' - The radius in meters that the user is looking for.
  - 'location' - The location that the user is looking for.
  - 'geolocation' - The geolocation that the user is looking for. See CafeSearchRequest for more information.
  - 'openNow' - Whether the cafe is open now or not.
  - 'tags' - The tags that the user is looking for.

Note: Query is similar to how you would search something up in Google Maps or Yelp. The reason for this is because we are actually going to be passing in the query in the TextSearch function provided by the Places API.

Here is an example of how I plan to use the tags:

```typescript
const cafeRequest: CafeSearchRequest = {
  query: req.body.query,
  radius: req.body.radius,
  location: req.body.location,
  geolocation: req.body.geolocation,
  openNow: req.body.openNow,
  tags: req.body.tags,
};
```

- **Response**
  - 200 - Returns an array of Cafe objects that match the search query. I would look at the Cafe type for more information.
  - 400 - Returns an error message if the query is invalid.
