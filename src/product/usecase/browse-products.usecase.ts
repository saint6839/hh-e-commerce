import { Inject, Injectable } from '@nestjs/common';
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
  ) {}

  /**
   * 전체 상품 목록과 해당 상품에 속한 옵션들을 조회하는 usecase
   * @returns
   */
  async execute(
    dto: void,
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

      return Promise.all(productDtosPromises);
    };

    if (entityManager) {
      return transactionCallback(entityManager);
    } else {
      return this.dataSource.transaction(transactionCallback);
    }
  }
}
