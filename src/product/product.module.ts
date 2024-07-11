import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IDailyPopularProductRepositoryToken } from './domain/interface/repository/daily-popular-product.repository.interface';
import { IProductOptionRepositoryToken } from './domain/interface/repository/product-option.repository.interface';
import { IProductRepositoryToken } from './domain/interface/repository/product.repository.interface';
import { IBrowsePopularProductsFacadeUseCaseToken } from './domain/interface/usecase/browse-popular-products-facade.usecase.interface';
import { IBrowseProductsUseCaseToken } from './domain/interface/usecase/browse-products.usecase.interface';
import { IDecreaseProductStockUsecaseToken } from './domain/interface/usecase/decrease-product-stock.usecase.interface';
import { IReadProductUseCaseToken } from './domain/interface/usecase/read-product.usecase.interface';
import { DailyPopularProductEntity } from './infrastructure/entity/daily-popular-product.entity';
import { ProductOptionEntity } from './infrastructure/entity/product-option.entity';
import { ProductEntity } from './infrastructure/entity/product.entity';
import { DailyPopularProductRepository } from './infrastructure/repository/daily-popular-product.repository';
import { ProductOptionRepository } from './infrastructure/repository/product-option.repository';
import { ProductRepository } from './infrastructure/repository/product.repository';
import { ProductController } from './presentation/controller/product.controller';
import { BrowsePopularProductsFacadeUseCase } from './usecase/browse-popular-products-facade.usecase';
import { BrowseProductsUseCase } from './usecase/browse-products.usecase';
import { DecreaseProductStockUseCase } from './usecase/decrease-product-stock.usecase';
import { ReadProductUseCase } from './usecase/read-product.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductOptionEntity,
      DailyPopularProductEntity,
    ]),
  ],
  controllers: [ProductController],
  exports: [
    IDecreaseProductStockUsecaseToken,
    IProductRepositoryToken,
    IProductOptionRepositoryToken,
    IDailyPopularProductRepositoryToken,
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
      provide: IDailyPopularProductRepositoryToken,
      useClass: DailyPopularProductRepository,
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
    {
      provide: IBrowsePopularProductsFacadeUseCaseToken,
      useClass: BrowsePopularProductsFacadeUseCase,
    },
  ],
})
export class ProductModule {}
