import { DailyPopularProductEntity } from 'src/product/infrastructure/entity/daily-popular-product.entity';
import { EntityManager } from 'typeorm';
export const IDailyPopularProductRepositoryToken = Symbol(
  'IDailyPopularProductRepository',
);

export interface IDailyPopularProductRepository {
  save(
    entity: DailyPopularProductEntity,
    entityManager?: EntityManager,
  ): Promise<DailyPopularProductEntity>;

  findOne(
    productId: number,
    productOptionId: number,
    soldDate: Date,
    entityManager?: EntityManager,
  ): Promise<DailyPopularProductEntity | null>;

  findOneWithLock(
    productId: number,
    productOptionId: number,
    soldDate: Date,
    entityManager?: EntityManager,
  ): Promise<DailyPopularProductEntity | null>;

  findTopSoldByDateRange(
    from: Date,
    to: Date,
    limit: number,
    entityManager?: EntityManager,
  ): Promise<DailyPopularProductEntity[]>;
}
