import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  IDailyPopularProductRepository,
  IDailyPopularProductRepositoryToken,
} from '../domain/interface/repository/daily-popular-product.repository.interface';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from '../domain/interface/repository/product-option.repository.interface';
import { IAccumulatePopularProductsSoldUseCase } from '../domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { DailyPopularProductEntity } from '../infrastructure/entity/daily-popular-product.entity';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from '../infrastructure/entity/product-option.entity';
import { AccumulatePopularProductsSoldDto } from './../presentation/dto/request/accumulate-popular-products-sold.dto';

@Injectable()
export class AccumulatePopularProductsSoldUseCase
  implements IAccumulatePopularProductsSoldUseCase
{
  constructor(
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    @Inject(IDailyPopularProductRepositoryToken)
    private readonly dailyPopularProductRepository: IDailyPopularProductRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 일자별로 특정 상품의 판매량을 누적하는 usecase
   * 판매량 누적은 실제로 결제가 모두 완료되었을 경우에만 누적됩니다. (주문시에는 누적 X)
   * @returns
   */
  async execute(
    dto: AccumulatePopularProductsSoldDto,
    entityManager?: EntityManager,
  ): Promise<void> {
    const transactionCallback = async (
      transactionalEntityManager: EntityManager,
    ) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const orderItem of dto.orderItems) {
        const productOptionEntity =
          await this.productOptionRepository.findByIdWithLock(
            orderItem.productOptionId,
            transactionalEntityManager,
          );

        if (!productOptionEntity) {
          throw new Error(
            NOT_FOUND_PRODUCT_OPTION_ERROR + ': ' + orderItem.productOptionId,
          );
        }

        const existingDailyPopularProductEntity =
          await this.dailyPopularProductRepository.findOneWithLock(
            productOptionEntity.productId,
            productOptionEntity.id,
            today,
            transactionalEntityManager,
          );

        if (existingDailyPopularProductEntity) {
          existingDailyPopularProductEntity.accumulateTotalSold(
            orderItem.quantity,
          );
          await this.dailyPopularProductRepository.save(
            existingDailyPopularProductEntity,
            transactionalEntityManager,
          );
        } else {
          const newDailyPopularProductEntity = DailyPopularProductEntity.of(
            productOptionEntity.productId,
            productOptionEntity.id,
            orderItem.quantity,
            today,
          );
          await this.dailyPopularProductRepository.save(
            newDailyPopularProductEntity,
            transactionalEntityManager,
          );
        }
      }
    };

    if (entityManager) {
      return await transactionCallback(entityManager);
    } else {
      return await this.dataSource.transaction(transactionCallback);
    }
  }
}
