import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { IDailyPopularProductRepository } from 'src/product/domain/interface/repository/daily-popular-product.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { DailyPopularProductEntity } from '../entity/daily-popular-product.entity';

@Injectable()
export class DailyPopularProductRepository
  extends BaseRepository<DailyPopularProductEntity>
  implements IDailyPopularProductRepository
{
  constructor(
    @InjectRepository(DailyPopularProductEntity)
    private readonly dailyPopularProductRepository: Repository<DailyPopularProductEntity>,
  ) {
    super(dailyPopularProductRepository);
  }

  async findOne(
    productId: number,
    productOptionId: number,
    soldDate: Date,
    entityManager?: EntityManager,
  ): Promise<DailyPopularProductEntity | null> {
    return this.executeQuery(
      (repo) =>
        repo.findOne({
          where: {
            productId,
            productOptionId,
            soldDate,
          },
        }),
      entityManager,
    );
  }

  async save(entity: DailyPopularProductEntity, entityManager: EntityManager) {
    return this.executeQuery(
      async (repo) => await repo.save(entity),
      entityManager,
    );
  }
}
