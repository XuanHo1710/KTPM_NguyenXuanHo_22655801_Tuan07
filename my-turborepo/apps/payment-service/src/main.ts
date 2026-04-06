import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('PaymentService');

  app.enableCors({ origin: '*' });

  const port = 3005;
  const host = '192.168.137.244'; // Khai báo IP bạn muốn chạy

  // Truyền host vào làm tham số thứ 2
  await app.listen(port, host);
  logger.log(`💳 Payment Service (HTTP) is running on http://localhost:${port}`);
}
bootstrap();
