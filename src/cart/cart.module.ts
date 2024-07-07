import { Module } from '@nestjs/common';
import { CartController } from './presentation/controller/cart.controller';

@Module({
  imports: [],
  controllers: [CartController],
  providers: [],
})
export class CartModule {}
