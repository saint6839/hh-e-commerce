import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { IOrderItemRepository } from 'src/order/domain/interface/repository/order-item.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { OrderItemEntity } from '../entity/order-item.entity';

@Injectable()
export class OrderItemRepository
  extends BaseRepository<OrderItemEntity>
  implements IOrderItemRepository
{
  constructor(
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
  ) {
    super(orderItemRepository);
  }
  async findByOrderId(
    orderId: number,
    entityManager?: EntityManager | undefined,
  ): Promise<OrderItemEntity[]> {
    return this.executeQuery(
      async (repo) => await repo.find({ where: { orderId } }),
      entityManager,
    );
  }

  async create(
    entity: OrderItemEntity,
    entityManager?: EntityManager | undefined,
  ): Promise<OrderItemEntity> {
    return this.executeQuery(
      async (repo) => await repo.save(entity),
      entityManager,
    );
  }
}
