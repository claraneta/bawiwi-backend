/// <reference types="jest" />

jest.mock('../../shared/middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-001', email: 'client@example.com', role: 'client' };
    next();
  }),
  requireRole: jest.fn(() => (req: any, _res: any, next: any) => next()),
}));

jest.mock('./service-feed.transaction', () => ({
  createServiceFeed: jest.fn(),
}));

import request from 'supertest';
import express from 'express';
import serviceFeedRoutes from './service-feed.route';
import { createServiceFeed } from './service-feed.transaction';

const mockedCreateServiceFeed = jest.mocked(createServiceFeed);

describe('Service Feed Feature', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/service-feeds', serviceFeedRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /service-feeds', () => {
    const validBody = {
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Need a plumber',
      description: 'Fixing a leaky faucet',
      location: 'Manila',
    };

    const mockFeed = {
      id: 'feed-001',
      userId: 'user-001',
      ...validBody,
      status: 'active',
    };

    it('should return 201 with the created service feed', async () => {
      mockedCreateServiceFeed.mockResolvedValue({ success: true, serviceFeed: mockFeed as any });

      const response = await request(app)
        .post('/service-feeds')
        .send(validBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        error: 0,
        data: mockFeed,
        message: 'Created successfully',
      });
    });

    it('should call createServiceFeed with the authenticated user id', async () => {
      mockedCreateServiceFeed.mockResolvedValue({ success: true, serviceFeed: mockFeed as any });

      await request(app)
        .post('/service-feeds')
        .send(validBody);

      expect(mockedCreateServiceFeed).toHaveBeenCalledWith({
        userId: 'user-001',
        serviceId: validBody.serviceId,
        title: validBody.title,
        description: validBody.description,
        location: validBody.location,
        coordinates: undefined,
      });
    });

    it('should include coordinates when provided', async () => {
      const bodyWithCoords = {
        ...validBody,
        coordinates: { lat: 14.5995, lng: 120.9842 },
      };
      mockedCreateServiceFeed.mockResolvedValue({ success: true, serviceFeed: { ...mockFeed, coordinates: bodyWithCoords.coordinates } as any });

      await request(app)
        .post('/service-feeds')
        .send(bodyWithCoords);

      expect(mockedCreateServiceFeed).toHaveBeenCalledWith(
        expect.objectContaining({ coordinates: bodyWithCoords.coordinates }),
      );
    });

    it('should return 500 when createServiceFeed fails', async () => {
      mockedCreateServiceFeed.mockResolvedValue({ success: false, error: 'Service not found' });

      const response = await request(app)
        .post('/service-feeds')
        .send(validBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 1,
        data: null,
        message: 'Service not found',
      });
    });

    it('should return 400 when validation fails', async () => {
      const response = await request(app)
        .post('/service-feeds')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 403 when user is not authenticated', async () => {
      // Override the authenticate mock to simulate unauthenticated request
      const auth = require('../../shared/middleware/auth');
      auth.authenticate.mockImplementationOnce((_req: any, res: any, _next: any) => {
        res.status(403).json({ error: 1, data: null, message: 'Forbidden' });
      });

      const response = await request(app)
        .post('/service-feeds')
        .send(validBody);

      expect(response.status).toBe(403);
    });
  });
});
