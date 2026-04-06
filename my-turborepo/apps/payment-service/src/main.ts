import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('PaymentService');

  app.enableCors({ origin: '*' });

  const port = 3005;
  await app.listen(port);
  logger.log(`💳 Payment Service (HTTP) is running on http://localhost:${port}`);
}
bootstrap();
