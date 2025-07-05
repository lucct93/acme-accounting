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
  } catch (error) {
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
