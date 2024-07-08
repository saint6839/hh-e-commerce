import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IProductOptionRepositoryToken } from './domain/interface/repository/product-option.repository.interface';
import { IProductRepositoryToken } from './domain/interface/repository/product.repository.interface';
import { IBrowseProductsUseCaseToken } from './domain/interface/usecase/browse-products.usecase.interface';
import { IDecreaseProductStockUsecaseToken } from './domain/interface/usecase/decrease-product-stock.usecase.interface';
import { IReadProductUseCaseToken } from './domain/interface/usecase/read-product.usecase.interface';
import { ProductOptionEntity } from './infrastructure/entity/product-option.entity';
import { ProductEntity } from './infrastructure/entity/product.entity';
import { ProductOptionRepository } from './infrastructure/repository/product-option.repository';
import { ProductRepository } from './infrastructure/repository/product.repository';
import { ProductController } from './presentation/controller/product.controller';
import { BrowseProductsUseCase } from './usecase/browse-products.usecase';
import { DecreaseProductStockUseCase } from './usecase/decrease-product-stock.usecase';
import { ReadProductUseCase } from './usecase/read-product.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, ProductOptionEntity])],
  controllers: [ProductController],
  exports: [
    IDecreaseProductStockUsecaseToken,
    IProductRepositoryToken,
    IProductOptionRepositoryToken,
    TypeOrmModule,
  ],
  providers: [
    {
      provide: IProductRepositoryToken,
      useClass: ProductRepository,
    },
    {
      provide: IProductOptionRepositoryToken,
      useClass: ProductOptionRepository,
    },
    {
      provide: IBrowseProductsUseCaseToken,
      useClass: BrowseProductsUseCase,
    },
    {
      provide: IReadProductUseCaseToken,
      useClass: ReadProductUseCase,
    },
    {
      provide: IDecreaseProductStockUsecaseToken,
      useClass: DecreaseProductStockUseCase,
    },
  ],
})
export class ProductModule {}
