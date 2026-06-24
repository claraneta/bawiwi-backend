import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Service } from '../entities/service.entity';

const SERVICES = [
  { name: 'plumbing' },
  { name: 'aircon services' },
  { name: 'electrical' },
];

export async function seedServices(dataSource?: DataSource): Promise<void> {
  const ds = dataSource ?? await AppDataSource.initialize();
  const ownConnection = !dataSource;

  try {
    if (ownConnection) {
      console.log('Database connected successfully.');
    }

    const serviceRepository = ds.getRepository(Service);

    for (const serviceData of SERVICES) {
      const existing = await serviceRepository.findOneBy({
        name: serviceData.name,
      });

      if (existing) {
        console.log(`Service "${serviceData.name}" already exists, skipping.`);
        continue;
      }

      const service = serviceRepository.create(serviceData);
      await serviceRepository.save(service);
      console.log(`Service "${serviceData.name}" created successfully.`);
    }

    console.log('Services seeding completed!');
  } catch (error) {
    console.error('Error seeding services:', error);
    throw error;
  } finally {
    if (ownConnection) {
      await ds.destroy();
    }
  }
}

if (require.main === module) {
  seedServices().catch((error) => {
    console.error('Seeder exited with error:', error);
    process.exit(1);
  });
}
