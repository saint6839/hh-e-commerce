import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { IProductRepository } from 'src/product/domain/interface/repository/product.repository.interface';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { ProductEntity } from '../entity/product.entity';

@Injectable()
export class ProductRepository
  extends BaseRepository<ProductEntity>
  implements IProductRepository
{
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {
    super(productRepository);
  }

  async findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<ProductEntity | null> {
    return this.executeQuery(
      (repo) => repo.findOne({ where: { id, deletedAt: IsNull() } }),
      entityManager,
    );
  }

  /**
   * 상품의 상태에 대한 정확한 요구사항은 없었기에, 상품 status 활성/비활성 여부를 조회 조건에 포함시키지는 않았습니다.
   * @returns
   */
  async findAll(entityManager?: EntityManager): Promise<ProductEntity[]> {
    return this.executeQuery(
      (repo) =>
        repo.find({
          where: {
            deletedAt: IsNull(),
          },
        }),
      entityManager,
    );
  }

  async findByIdWithLock(
    id: number,
    entityManager?: EntityManager,
  ): Promise<ProductEntity | null> {
    return this.executeQuery(
      async (repo) =>
        await repo
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id })
          .getOne(),
      entityManager,
    );
  }
}
