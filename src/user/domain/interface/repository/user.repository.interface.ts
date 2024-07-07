import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { EntityManager } from 'typeorm';

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository {
  findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<UserEntity | null>;
}
