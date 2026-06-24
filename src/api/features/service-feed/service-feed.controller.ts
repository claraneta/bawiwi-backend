import { Request, Response } from 'express';
import { created, forbidden, internalError } from '../../response-builder';
import { createServiceFeed } from './service-feed.transaction';
import { CreateServiceFeedBody } from './service-feed.validator';

export const createFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      forbidden(res);
      return;
    }

    const { serviceId, title, description, location, coordinates }: CreateServiceFeedBody = req.body;

    const result = await createServiceFeed({
      userId: user.userId,
      serviceId,
      title,
      description,
      location,
      coordinates,
    });

    if (!result.success) {
      internalError(res, result.error);
      return;
    }

    created(res, result.serviceFeed);
    return;
  } catch (error) {
    internalError(res);
    return;
  }
};
