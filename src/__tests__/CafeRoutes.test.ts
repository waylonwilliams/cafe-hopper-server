import request from 'supertest';
import express from 'express';
import CafeRoutes from '@/routes/CafeRoutes';

const app = express();
app.use(express.json());
app.use('/cafes', CafeRoutes);

describe('CafeRoutes', () => {
  it('Test search cafes', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Abbey',
        radius: 5000,
        geolocation: {
          lat: 51.5074,
          lng: 0.1278,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('Incorrect Geolocation should return 400', async () => {
    const response = await request(app).post('/cafes/search').send({
      query: 'Abbey',
      radius: 5000,
      geolocation: 'santa cruz',
      openNow: 'true',
    });
    expect(response.status).toBe(400);
  });

  it('Incorrect SortBy option should return 400', async () => {
    const response = await request(app)
      .post('/cafes/search')
      .send({
        query: 'Abbey',
        radius: 5000,
        geolocation: {
          lat: 51.5074,
          lng: 0.1278,
        },
        sortBy: 'popularity',
      });
    expect(response.status).toBe(400);
  });
});
