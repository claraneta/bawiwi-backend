import { AppDataSource } from '../data-source';
import { seedServices } from './services.seeder';

async function runSeeders(): Promise<void> {
  try {
    const dataSource = await AppDataSource.initialize();
    console.log('Database connected successfully.\n');

    console.log('--- Running Services Seeder ---');
    await seedServices(dataSource);

    // Add future seeders here:
    // console.log('\n--- Running XYZ Seeder ---');
    // await seedXyz(dataSource);

    console.log('\nAll seeders completed!');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error running seeders:', error);
    process.exit(1);
  }
}

runSeeders();
