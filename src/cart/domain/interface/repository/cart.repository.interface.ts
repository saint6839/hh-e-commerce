import { EntityManager } from 'typeorm';
import { CartEntity } from '../../../infrastructure/entity/cart.entity';

export const ICartRepositoryToken = Symbol('ICartRepository');

export interface ICartRepository {
  findByUserId(
    userId: number,
    entityManager?: EntityManager,
  ): Promise<CartEntity[]>;
  create(
    entity: CartEntity,
    entityManager?: EntityManager,
  ): Promise<CartEntity>;

  delete(id: number, entityManager?: EntityManager): Promise<void>;
}
