import { AppDataSource } from '../../../db/data-source';
import { ServiceFeed, ServiceFeedStatus } from '../../../db/entities/service-feed.entity';

export interface CreateServiceFeedParams {
  userId: string;
  serviceId: string;
  title: string;
  description: string;
  location: string;
  coordinates?: object;
}

export type CreateServiceFeedResult =
  | { success: true; serviceFeed: ServiceFeed }
  | { success: false; error: string };

export async function createServiceFeed(
  params: CreateServiceFeedParams,
): Promise<CreateServiceFeedResult> {
  try {
    const savedFeed = await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ServiceFeed);

      const feed = repo.create({
        userId: params.userId,
        serviceId: params.serviceId,
        title: params.title,
        description: params.description,
        location: params.location,
        coordinates: params.coordinates,
        status: ServiceFeedStatus.ACTIVE,
      });

      return await repo.save(feed);
    });

    return { success: true, serviceFeed: savedFeed };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create service feed';
    return { success: false, error: message };
  }
}
