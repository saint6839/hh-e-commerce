import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { EntityManager } from 'typeorm';

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository {
  findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<UserEntity | null>;

  update(
    partialEntity: Partial<UserEntity> & { id: number },
    entityManager?: EntityManager,
  ): Promise<UserEntity>;

  updateOptimistic(
    partialEntity: Partial<UserEntity> & { id: number; version: number },
    entityManager?: EntityManager,
  ): Promise<UserEntity>;
}
