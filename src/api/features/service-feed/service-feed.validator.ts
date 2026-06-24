import { z } from 'zod';

export const createServiceFeedSchema = z.object({
  serviceId: z.string().uuid({ message: 'Invalid service ID format' }),
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  coordinates: z
    .object({
      lat: z.number({ message: 'Latitude must be a number' }),
      lng: z.number({ message: 'Longitude must be a number' }),
    })
    .optional(),
});

export type CreateServiceFeedBody = z.infer<typeof createServiceFeedSchema>;
