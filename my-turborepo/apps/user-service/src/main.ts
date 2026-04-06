import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('UserService');

  app.enableCors({ origin: '*' });

  const port = 3001;
  await app.listen(port);
  logger.log(`👤 User Service (HTTP) is running on http://localhost:${port}`);
}
void bootstrap();
