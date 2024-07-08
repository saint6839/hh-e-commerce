import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartModule } from '../../src/cart/cart.module';
import { OrderModule } from '../../src/order/order.module';
import { PaymentModule } from '../../src/payment/payment.moduel';
import { ProductModule } from '../../src/product/product.module';
import { UserModule } from '../../src/user/user.module';

export async function setupTestingModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'mysql',
        driver: require('mysql2'),
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3307', 10),
        username: process.env.DB_USERNAME || 'testuser',
        password: process.env.DB_PASSWORD || 'testpassword',
        database: process.env.DB_DATABASE || 'testdb',
        entities: [
          __dirname + '/../../src/**/*.entity{.ts,.js}',
          __dirname + '/../../dist/**/*.entity{.ts,.js}',
        ],
        synchronize: true,
        extra: {
          connectionLimit: 50,
          queueLimit: 0,
        },
        poolSize: 50,
      }),
      UserModule,
      ProductModule,
      OrderModule,
      CartModule,
      PaymentModule,
    ],
    providers: [
      {
        provide: APP_PIPE,
        useClass: ValidationPipe,
      },
    ],
  }).compile();
}
