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
    const startTime = Date.now();
    this.logger.log(`DTO 생성 시간: ${Date.now() - startTime}ms`);

    const lockResource = `product_option:${dto.productOptionId}`;
    let lock;

    try {
      lock = await this.redisLockService.acquireLock(lockResource, 1000);
      this.logger.log(`락 획득 시간: ${Date.now() - startTime}ms`);

      const transactionCallback = async (
        transactionEntityManager: EntityManager,
      ) => {
        const transactionStartTime = Date.now();

        const productOptionEntity = await this.productOptionRepository.findById(
          dto.productOptionId,
          transactionEntityManager,
        );
        this.logger.log(
          `상품 옵션 조회 시간: ${Date.now() - transactionStartTime}ms`,
        );

        if (!productOptionEntity) {
          throw new Error(
            NOT_FOUND_PRODUCT_OPTION_ERROR + ': ' + dto.productOptionId,
          );
        }

        const productOption: ProductOption =
          ProductOption.fromEntity(productOptionEntity);
        const decreaseStockStartTime = Date.now();
        productOption.decreaseStock(dto.quantity);
        this.logger.log(
          `재고 감소 처리 시간: ${Date.now() - decreaseStockStartTime}ms`,
        );

        const updateStockStartTime = Date.now();
        await this.productOptionRepository.updateStock(
          dto.productOptionId,
          productOption.stock,
          transactionEntityManager,
        );
        this.logger.log(
          `재고 업데이트 시간: ${Date.now() - updateStockStartTime}ms`,
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

        this.logger.log(
          `트랜잭션 총 처리 시간: ${Date.now() - transactionStartTime}ms`,
        );

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
      console.error(`Error in DecreaseProductStockUseCase: ${error.message}`);
      throw error;
    } finally {
      if (lock) {
        try {
          await this.redisLockService.releaseLock(lock);
        } catch (releaseError) {
          console.error(`Error releasing lock: ${releaseError.message}`);
        }
      }
      this.logger.log(`전체 처리 시간: ${Date.now() - startTime}ms`);
    }
  }
}
