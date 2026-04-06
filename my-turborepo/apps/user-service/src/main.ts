import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('UserService');

  app.enableCors({ origin: '*' });

  const port = 3005;
  const host = '192.168.137.49';
  await app.listen(port, host);
  logger.log(`👤 User Service (HTTP) is running on http://localhost:${port}`);
}
void bootstrap();
