import { Module } from '@nestjs/common';
import { ProductController } from './presentation/controller/product.controller';

@Module({
  imports: [],
  controllers: [ProductController],
  providers: [],
})
export class ProductModule {}
