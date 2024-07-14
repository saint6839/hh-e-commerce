import { ProductOptionEntity } from 'src/product/infrastructure/entity/product-option.entity';
import { EntityManager } from 'typeorm';

export const IProductOptionRepositoryToken = Symbol('IProductOptionRepository');

export interface IProductOptionRepository {
  findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<ProductOptionEntity | null>;

  findByProductId(
    productId: number,
    entityManager?: EntityManager,
  ): Promise<ProductOptionEntity[]>;

  updateStock(
    id: number,
    stock: number,
    entityManager?: EntityManager,
  ): Promise<void>;

  findByIdWithLock(
    id: number,
    entityManager?: EntityManager,
  ): Promise<ProductOptionEntity | null>;

  findByIds(
    ids: number[],
    entityManager?: EntityManager,
  ): Promise<ProductOptionEntity[]>;
}
