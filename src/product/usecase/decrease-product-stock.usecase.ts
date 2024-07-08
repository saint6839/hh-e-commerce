import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ProductOption } from '../domain/entity/product-option';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from '../domain/interface/repository/product-option.repository.interface';
import {
  IProductRepository,
  IProductRepositoryToken,
} from '../domain/interface/repository/product.repository.interface';
import { IDecreaseProductStockUsecase } from '../domain/interface/usecase/decrease-product-stock.usecase.interface';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from '../infrastructure/entity/product-option.entity';
import { NOT_FOUND_PRODUCT_ERROR } from '../infrastructure/entity/product.entity';
import { DecreaseProductStockDto } from '../presentation/dto/request/decrease-product-stock.dto';
import { ProductOptionDto } from '../presentation/dto/response/product-option.dto';
import { ProductDto } from '../presentation/dto/response/product.dto';

@Injectable()
export class DecreaseProductStockUseCase
  implements IDecreaseProductStockUsecase
{
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    dto: DecreaseProductStockDto,
    entityManager?: EntityManager,
  ): Promise<ProductDto> {
    const transactionCallback = async (
      transactionEntityManager: EntityManager,
    ) => {
      const productOptionEntity = await this.productOptionRepository.findById(
        dto.productOptionId,
        transactionEntityManager,
      );

      if (!productOptionEntity) {
        throw new Error(
          NOT_FOUND_PRODUCT_OPTION_ERROR + ': ' + dto.productOptionId,
        );
      }

      const productOption: ProductOption =
        ProductOption.fromEntity(productOptionEntity);
      productOption.decreaseStock(dto.quantity);

      await this.productOptionRepository.updateStock(
        dto.productOptionId,
        productOption.stock,
        transactionEntityManager,
      );

      const productEntity = await this.productRepository.findById(
        productOptionEntity.productId,
        transactionEntityManager,
      );

      if (!productEntity) {
        throw new Error(
          NOT_FOUND_PRODUCT_ERROR + ': ' + productOptionEntity.productId,
        );
      }

      return new ProductDto(
        productEntity.id,
        productEntity.name,
        [
          new ProductOptionDto(
            productOptionEntity.id,
            productOptionEntity.name,
            productOptionEntity.price,
            productOption.stock,
            productEntity.id,
          ),
        ],
        productEntity.status,
      );
    };

    if (entityManager) {
      // 이미 트랜잭션 내부에 있는 경우
      return await transactionCallback(entityManager);
    } else {
      // 새로운 트랜잭션 시작
      return await this.dataSource.transaction(transactionCallback);
    }
  }
}
