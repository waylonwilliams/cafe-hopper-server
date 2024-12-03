import request from 'supertest';
import express from 'express';
import CafeRoutes from '@/routes/CafeRoutes';
import { Cafe } from '@/utils/types';

const app = express();
app.use(express.json());
app.use('/cafes', CafeRoutes);

describe('CafeRoutes', () => {
  it('Test search cafes', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Verve',
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty('cafes');
    expect(response.body.cafes).toBeInstanceOf(Array);
  });

  it('Incorrect Geolocation should return 400', async () => {
    const response = await request(app).post('/cafes/search').send({
      query: 'Abbey',
      radius: 5000,
      geolocation: 'santa cruz',
      openNow: 'true',
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Incorrect SortBy option should return 400', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Abbey',
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
        sortBy: 'popularity',
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Searching by tags should return 200, and also each cafe returned should have at least those tags', async () => {
    const tags = ['📚 Workable', '🛜 Free wifi', '🥐 Good pastries'];
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Verve',
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
        tags: tags,
      });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty('cafes');
    expect(response.body.cafes).toBeInstanceOf(Array);
    response.body.cafes.forEach((cafe: Cafe) => {
      expect(cafe.tags).toEqual(expect.arrayContaining(tags));
    });
  });

  it('Searching without a specified query should still return cafes', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
      });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty('cafes');
    expect(response.body.cafes).toBeInstanceOf(Array);
  });

  it('Searching with a customTime should return 200 and the cafes should be open at that time', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Verve',
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
        customTime: {
          day: 0,
          time: '0200',
        },
      });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty('cafes');
    expect(response.body.cafes).toBeInstanceOf(Array);
    // nothing should be open at 2am
    expect(response.body.cafes.length).toBe(0);
  });

  it('Searching with a customTime should allow either day or time to be omitted', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Verve',
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
        customTime: {
          day: 0,
        },
      });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty('cafes');
    expect(response.body.cafes).toBeInstanceOf(Array);
  });

  it('Searching with an incorrect customTime provided should return 400', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Verve',
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
        customTime: {
          day: 0,
          time: '25:00',
        },
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('Searching by rating should return 200 and the cafes should have at least that rating', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        radius: 5000,
        geolocation: {
          lat: 36.99615335186937,
          lng: -122.05984320144475,
        },
        rating: 4.5,
      });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body).toHaveProperty('cafes');
    expect(response.body.cafes).toBeInstanceOf(Array);
    response.body.cafes.forEach((cafe: Cafe) => {
      expect(cafe.rating).toBeGreaterThanOrEqual(4.5);
    });
  });
});
