import request from 'supertest';
import express from 'express';
import helloRoutes from './index';

describe('Hello Feature', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/hello', helloRoutes);
  });

  describe('GET /hello', () => {
    it('should return hello world message', async () => {
      const response = await request(app).get('/hello');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello, World!' });
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/hello');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
