import { Module } from '@nestjs/common';
import { OrderController } from './presentation/controller/order.controller';

@Module({
  imports: [],
  controllers: [OrderController],
  providers: [],
})
export class OrderModule {}
