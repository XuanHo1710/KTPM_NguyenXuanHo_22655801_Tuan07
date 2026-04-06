import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AllExceptionsFilter } from './core/exception.filter';
import { TransformInterceptor } from './core/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Product PC API')
    .setDescription('The product PC API description')
    .setVersion('1.0')
    .addTag('product')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Config CORS
  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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

  const port = Number(configService.get('PORT') ?? 3002);
  await app.listen(port);
}
bootstrap();
