import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { IOutboxRepositoryToken } from 'src/common/outbox/domain/interface/outbox.repository.interface';
import { OutboxEntity } from 'src/common/outbox/repository/entity/outbox.entity';
import { OutboxRepository } from 'src/common/outbox/repository/repository/outbox.repository';
import { RedisModule } from 'src/common/redis/redis.module';
import { CartModule } from '../../src/cart/cart.module';
import { OrderModule } from '../../src/order/order.module';
import { PaymentModule } from '../../src/payment/payment.module';
import { ProductModule } from '../../src/product/product.module';
import { UserModule } from '../../src/user/user.module';

export async function setupTestingModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3307', 10),
        username: process.env.DB_USERNAME || 'testuser',
        password: process.env.DB_PASSWORD || 'testpassword',
        database: process.env.DB_DATABASE || 'testdb',
        entities: [
          __dirname + '/../../src/**/*.entity{.ts,.js}',
          __dirname + '/../../dist/**/*.entity{.ts,.js}',
          OutboxEntity,
        ],
        synchronize: true,
        dropSchema: true,
        logging: false,
        autoLoadEntities: true,
        driver: require('mysql2'),
      }),
      TypeOrmModule.forFeature([OutboxEntity]),
      UserModule,
      ProductModule,
      OrderModule,
      CartModule,
      PaymentModule,
      RedisModule,
    ],
    providers: [
      {
        provide: APP_PIPE,
        useClass: ValidationPipe,
      },
      {
        provide: IOutboxRepositoryToken,
        useClass: OutboxRepository,
      },
      LoggerService,
    ],
  }).compile();
}

export async function teardownTestingModule(module: TestingModule) {
  const redisClient = module.get('REDIS_CLIENT');
  await redisClient.quit();
  await module.close();
}
