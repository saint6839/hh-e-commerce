import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { DataSource, EntityManager } from 'typeorm';
import { RedisLockService } from '../../common/redis/redis-lock.service';
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
    private readonly redisLockService: RedisLockService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 주문서 생성시 특정 상품의 재고를 감소 시키는 usecase
   * @returns
   */
  async execute(
    dto: DecreaseProductStockDto,
    entityManager?: EntityManager,
  ): Promise<ProductDto> {
    const lockResource = `product_option:${dto.productOptionId}`;
    let lock;

    try {
      lock = await this.redisLockService.acquireLock(lockResource, 1000);

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

      let result;
      if (entityManager) {
        result = await transactionCallback(entityManager);
      } else {
        result = await this.dataSource.transaction(transactionCallback);
      }

      return result;
    } catch (error) {
      throw error;
    } finally {
      if (lock) {
        await this.redisLockService.releaseLock(lockResource, lock);
      }
    }
  }
}
