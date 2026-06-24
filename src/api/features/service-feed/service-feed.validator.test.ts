/// <reference types="jest" />

import { createServiceFeedSchema } from './service-feed.validator';

describe('createServiceFeedSchema (Zod schema)', () => {
  const validBody = {
    serviceId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Need a plumber',
    description: 'Fixing a leaky faucet',
    location: 'Manila',
  };

  describe('success path', () => {
    it('should accept a valid body', () => {
      const result = createServiceFeedSchema.safeParse(validBody);
      expect(result.success).toBe(true);
    });

    it('should accept optional coordinates', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        coordinates: { lat: 14.5995, lng: 120.9842 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('validation', () => {
    it('should reject missing serviceId', () => {
      const { serviceId, ...rest } = validBody;
      const result = createServiceFeedSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for serviceId', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        serviceId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        title: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 255 characters', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        title: 'x'.repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        description: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty location', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        location: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject coordinates with missing lat', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        coordinates: { lng: 120.9842 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject coordinates with missing lng', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        coordinates: { lat: 14.5995 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric lat', () => {
      const result = createServiceFeedSchema.safeParse({
        ...validBody,
        coordinates: { lat: 'invalid', lng: 120.9842 },
      });
      expect(result.success).toBe(false);
    });
  });
});
