import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedRunner } from './seeders/seed-runner';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'clear':
        await SeedRunner.clearAll();
        break;
      case 'refresh':
        await SeedRunner.clearAll();
        await SeedRunner.seedAll();
        break;
      default:
        await SeedRunner.seedAll();
        break;
    }
  } catch (err: unknown) {
    console.error(
      `seeding data with error ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => {
    console.log('App started successful!');
  })
  .catch((error: Error) => {
    console.log(`App exited with error ${error.message}`);
  });
