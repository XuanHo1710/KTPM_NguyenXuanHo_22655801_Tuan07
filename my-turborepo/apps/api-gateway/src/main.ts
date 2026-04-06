import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './core/exception.filter';
import { TransformInterceptor } from './core/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('APIGateway');

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Config CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: false }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  logger.log(`🚀 API Gateway (HTTP) is running on http://localhost:${port}`);
  logger.log(`📋 Endpoints (all via TCP microservices):`);
  logger.log(`   GET/POST        /api/v1/foods`);
  logger.log(`   GET/POST        /api/v1/orders`);
  logger.log(`   POST            /api/v1/payments`);
  logger.log(`   GET             /api/v1/payments`);
}
bootstrap();
