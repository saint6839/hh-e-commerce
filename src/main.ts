import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filter/api-exception.filter';
import { HttpLoggerInterceptor } from './common/interceptior/http-logger.interceptor';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new LoggerService();
  app.useLogger(logger);

  app.useGlobalFilters(new ApiExceptionFilter(logger));
  app.useGlobalInterceptors(new HttpLoggerInterceptor(logger));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const configService = app.get(ConfigService);
  const kafkaConfig: MicroserviceOptions = {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID', 'my-app'),
        brokers: [configService.get('KAFKA_BROKER', 'localhost:29092')],
      },
      consumer: {
        groupId: configService.get('KAFKA_CONSUMER_GROUP', 'my-consumer-group'),
      },
    },
  };

  app.connectMicroservice<MicroserviceOptions>(kafkaConfig);
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
