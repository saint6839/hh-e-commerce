import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ICartRepository } from 'src/cart/domain/interface/repository/cart.repository.interface';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { EntityManager, Repository } from 'typeorm';
import { CartEntity } from '../entity/cart.entity';

@Injectable()
export class CartRepository
  extends BaseRepository<CartEntity>
  implements ICartRepository
{
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
  ) {
    super(cartRepository);
  }
  async delete(id: number, entityManager?: EntityManager): Promise<void> {
    await this.executeQuery(
      (repo) =>
        repo.delete({
          id,
        }),
      entityManager,
    );
  }

  async findByUserId(
    userId: number,
    entityManager?: EntityManager,
  ): Promise<CartEntity[]> {
    return this.executeQuery(
      (repo) =>
        repo.find({
          where: {
            userId,
          },
        }),
      entityManager,
    );
  }
  async create(
    entity: CartEntity,
    entityManager?: EntityManager,
  ): Promise<CartEntity> {
    return this.executeQuery((repo) => repo.save(entity), entityManager);
  }
}
