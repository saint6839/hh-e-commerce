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
}
