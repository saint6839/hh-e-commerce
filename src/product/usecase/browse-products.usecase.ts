import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { CacheService } from 'src/common/redis/redis-cache.service';
import { DataSource, EntityManager } from 'typeorm';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from '../domain/interface/repository/product-option.repository.interface';
import {
  IProductRepository,
  IProductRepositoryToken,
} from '../domain/interface/repository/product.repository.interface';
import { IBrowseProductsUseCase } from '../domain/interface/usecase/browse-products.usecase.interface';
import { ProductOptionDto } from '../presentation/dto/response/product-option.dto';
import { ProductDto } from '../presentation/dto/response/product.dto';

@Injectable()
export class BrowseProductsUseCase implements IBrowseProductsUseCase {
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly loggerService: LoggerService,
  ) {}

  private getCacheKey(): string {
    return 'all_products1';
  }

  async execute(
    dto: void,
    entityManager?: EntityManager,
  ): Promise<ProductDto[]> {
    let result: ProductDto[];
    const cacheKey = this.getCacheKey();
    const cachedResult = await this.cacheService.get(cacheKey);

    if (cachedResult) {
      result = JSON.parse(cachedResult);
    } else {
      result = await this.fetchAndCacheProducts(entityManager);
    }
    return result;
  }

  private async fetchAndCacheProducts(
    entityManager?: EntityManager,
  ): Promise<ProductDto[]> {
    const transactionCallback = async (
      transactionalEntityManager: EntityManager,
    ) => {
      const productEntities = await this.productRepository.findAll(
        transactionalEntityManager,
      );

      const productDtosPromises = productEntities.map(async (productEntity) => {
        const productOptionEntities =
          await this.productOptionRepository.findByProductId(
            productEntity.id,
            transactionalEntityManager,
          );

        return new ProductDto(
          productEntity.id,
          productEntity.name,
          productOptionEntities.map(
            (productOptionEntity) =>
              new ProductOptionDto(
                productOptionEntity.id,
                productOptionEntity.name,
                productOptionEntity.price,
                productOptionEntity.stock,
                productOptionEntity.productId,
              ),
          ),
          productEntity.status,
        );
      });

      return await Promise.all(productDtosPromises);
    };

    let products: ProductDto[];
    if (entityManager) {
      products = await transactionCallback(entityManager);
    } else {
      products = await this.dataSource.transaction(transactionCallback);
    }

    const cacheKey = this.getCacheKey();
    await this.cacheService.set(cacheKey, JSON.stringify(products), 600);

    return products;
  }
}
