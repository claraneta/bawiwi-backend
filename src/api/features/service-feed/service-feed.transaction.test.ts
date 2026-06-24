/// <reference types="jest" />

jest.mock('../../../db/data-source', () => {
  const feedRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const managerMock = {
    getRepository: jest.fn().mockReturnValue(feedRepoMock),
  };

  return {
    AppDataSource: {
      transaction: jest.fn().mockImplementation(
        async (cb: (mgr: any) => Promise<unknown>) => cb(managerMock),
      ),
      _feedRepo: feedRepoMock,
    },
  };
});

import { createServiceFeed } from './service-feed.transaction';
import { ServiceFeedStatus } from '../../../db/entities/service-feed.entity';

describe('createServiceFeed', () => {
  let feedRepoMock: { create: jest.Mock; save: jest.Mock };

  const defaultParams = {
    userId: 'user-001',
    serviceId: 'service-001',
    title: 'Need a plumber',
    description: 'Fixing a leaky faucet',
    location: 'Manila',
  };

  const mockFeed = {
    id: 'feed-001',
    ...defaultParams,
    status: ServiceFeedStatus.ACTIVE,
  };

  beforeAll(() => {
    const { AppDataSource } = require('../../../db/data-source');
    feedRepoMock = AppDataSource._feedRepo;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('success path', () => {
    beforeEach(() => {
      feedRepoMock.create.mockReturnValue(mockFeed);
      feedRepoMock.save.mockResolvedValue(mockFeed);
    });

    it('should return success with the created service feed', async () => {
      const result = await createServiceFeed(defaultParams);

      expect(result).toEqual({ success: true, serviceFeed: mockFeed });
    });

    it('should create feed with default ACTIVE status', async () => {
      await createServiceFeed(defaultParams);

      expect(feedRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ServiceFeedStatus.ACTIVE }),
      );
    });

    it('should include optional coordinates when provided', async () => {
      const paramsWithCoords = {
        ...defaultParams,
        coordinates: { lat: 14.5995, lng: 120.9842 },
      };

      await createServiceFeed(paramsWithCoords);

      expect(feedRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ coordinates: paramsWithCoords.coordinates }),
      );
    });

    it('should call save with the created entity', async () => {
      await createServiceFeed(defaultParams);

      expect(feedRepoMock.save).toHaveBeenCalledWith(mockFeed);
    });
  });

  describe('failure path', () => {
    it('should return failure with error message when save fails', async () => {
      feedRepoMock.create.mockReturnValue(mockFeed);
      feedRepoMock.save.mockRejectedValue(new Error('Database error'));

      const result = await createServiceFeed(defaultParams);

      expect(result).toEqual({ success: false, error: 'Database error' });
    });

    it('should return fallback message when error is not an Error instance', async () => {
      feedRepoMock.create.mockReturnValue(mockFeed);
      feedRepoMock.save.mockRejectedValue('string error');

      const result = await createServiceFeed(defaultParams);

      expect(result).toEqual({ success: false, error: 'Failed to create service feed' });
    });
  });
});
