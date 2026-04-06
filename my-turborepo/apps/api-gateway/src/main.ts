import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { VersioningType, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('APIGateway');

  const configService = app.get(ConfigService);

  // Config CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
  });

  const port = 3000;
  const host = '192.168.137.49';
  await app.listen(port, host);

  logger.log(`🚀 API Gateway (HTTP) is running on http://localhost:${port}`);
  logger.log(`📋 Endpoints (all via TCP microservices):`);
  logger.log(`   POST  /api/v1/users/register`);
  logger.log(`   POST  /api/v1/users/login`);
  logger.log(`   GET   /api/v1/users`);
  logger.log(`   CRUD  /api/v1/foods`);
  logger.log(`   CRUD  /api/v1/orders`);
  logger.log(`   CRUD  /api/v1/payments`);
}
bootstrap();
