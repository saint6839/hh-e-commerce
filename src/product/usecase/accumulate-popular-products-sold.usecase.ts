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
        const productOptionEntity = await this.productOptionRepository.findById(
          orderItem.productOptionId,
          transactionalEntityManager,
        );

        if (!productOptionEntity) {
          throw new Error(
            NOT_FOUND_PRODUCT_OPTION_ERROR + ': ' + orderItem.productOptionId,
          );
        }

        const existingDailyPopularProductEntity =
          await this.dailyPopularProductRepository.findOne(
            productOptionEntity.productId,
            productOptionEntity.id,
            today,
            entityManager,
          );

        if (existingDailyPopularProductEntity) {
          existingDailyPopularProductEntity.accumulateTotalSold(
            orderItem.quantity,
          );
          await this.dailyPopularProductRepository.save(
            existingDailyPopularProductEntity,
            entityManager,
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
            entityManager,
          );
        }
      }
    };

    if (entityManager) {
      await transactionCallback(entityManager);
      return;
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionCallback(transactionalEntityManager);
    });
  }
}
