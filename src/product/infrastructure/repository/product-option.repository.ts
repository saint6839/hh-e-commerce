import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { IProductOptionRepository } from 'src/product/domain/interface/repository/product-option.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { ProductOptionEntity } from '../entity/product-option.entity';

@Injectable()
export class ProductOptionRepository
  extends BaseRepository<ProductOptionEntity>
  implements IProductOptionRepository
{
  constructor(
    @InjectRepository(ProductOptionEntity)
    private readonly productOptionRepository: Repository<ProductOptionEntity>,
  ) {
    super(productOptionRepository);
  }

  async findByIdWithLock(
    id: number,
    entityManager?: EntityManager | undefined,
  ): Promise<ProductOptionEntity | null> {
    return this.executeQuery(
      (repo) =>
        repo.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        }),
      entityManager,
    );
  }
  async updateStock(
    id: number,
    stock: number,
    entityManager?: EntityManager | undefined,
  ): Promise<void> {
    await this.executeQuery(
      (repo) =>
        repo.update(
          { id },
          {
            stock,
          },
        ),
      entityManager,
    );
  }

  async findByProductId(
    productId: number,
    entityManager?: EntityManager,
  ): Promise<ProductOptionEntity[]> {
    return this.executeQuery(
      (repo) =>
        repo.find({
          where: { productId },
        }),
      entityManager,
    );
  }

  async findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<ProductOptionEntity | null> {
    return this.executeQuery(
      (repo) => repo.findOne({ where: { id } }),
      entityManager,
    );
  }
}
