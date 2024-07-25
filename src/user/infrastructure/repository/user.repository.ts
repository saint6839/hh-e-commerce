import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { IUserRepository } from 'src/user/domain/interface/repository/user.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserRepository
  extends BaseRepository<UserEntity>
  implements IUserRepository
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super(userRepository);
  }

  async findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<UserEntity | null> {
    return this.executeQuery(
      (repo) => repo.findOne({ where: { id } }),
      entityManager,
    );
  }

  async update(
    partialEntity: Partial<UserEntity> & { id: number },
    entityManager?: EntityManager,
  ): Promise<UserEntity> {
    return this.executeQuery(async (repo) => {
      await repo.update(partialEntity.id, partialEntity);
      return repo.findOneOrFail({ where: { id: partialEntity.id } });
    }, entityManager);
  }

  async updateOptimistic(
    partialEntity: Partial<UserEntity> & { id: number; version: number },
    entityManager?: EntityManager,
  ): Promise<UserEntity> {
    return this.executeQuery(async (repo) => {
      const result = await repo
        .createQueryBuilder()
        .update(UserEntity)
        .set({ ...partialEntity, version: () => 'version + 1' })
        .where('id = :id AND version = :version', {
          id: partialEntity.id,
          version: partialEntity.version,
        })
        .execute();

      if (result.affected === 0) {
        throw new Error(
          '동시성 오류: 다른 트랜잭션에 의해 데이터가 변경되었습니다.',
        );
      }
      return repo.findOneOrFail({ where: { id: partialEntity.id } });
    }, entityManager);
  }
}
