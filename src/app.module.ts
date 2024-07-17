import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartModule } from './cart/cart.module';
import { LoggerService } from './common/logger/logger.service';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'hhplus',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    UserModule,
    ProductModule,
    OrderModule,
    CartModule,
    PaymentModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [LoggerService],
  controllers: [],
  providers: [LoggerService],
})
export class AppModule {}
