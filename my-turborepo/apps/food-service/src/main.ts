import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('FoodService');

  app.enableCors({ origin: '*' });

  const port = 3002;
  await app.listen(port);
  logger.log(`🍔 Food Service (HTTP) is running on http://localhost:${port}`);
}
bootstrap();
