import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IProductRepositoryToken } from './domain/interface/repository/product.repository.interface';
import { IBrowseProductsUseCaseToken } from './domain/interface/usecase/browse-products.usecase.interface';
import { ProductEntity } from './infrastructure/entity/product.entity';
import { ProductRepository } from './infrastructure/repository/product.repository';
import { ProductController } from './presentation/controller/product.controller';
import { BrowseProductsUseCase } from './usecase/browse-products.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductController],
  providers: [
    {
      provide: IProductRepositoryToken,
      useClass: ProductRepository,
    },
    {
      provide: IBrowseProductsUseCaseToken,
      useClass: BrowseProductsUseCase,
    },
  ],
})
export class ProductModule {}
