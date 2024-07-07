import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { EntityManager } from 'typeorm';

export const IProductRepositoryToken = Symbol('IProductRepository');

export interface IProductRepository {
  findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<ProductEntity | null>;

  findAll(entityManager?: EntityManager): Promise<ProductEntity[]>;
}