import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/common/interface/repository/base.repository.abstract';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { IOrderRepository } from 'src/order/domain/interface/repository/order.repository.interface';
import { EntityManager, Repository } from 'typeorm';
import { OrderEntity } from '../entity/order.entity';

@Injectable()
export class OrderRepository
  extends BaseRepository<OrderEntity>
  implements IOrderRepository
{
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {
    super(orderRepository);
  }
  async findById(
    id: number,
    entityManager?: EntityManager | undefined,
  ): Promise<OrderEntity | null> {
    return this.executeQuery(
      async (repo) => await repo.findOne({ where: { id } }),
      entityManager,
    );
  }
  async updateStatus(
    id: number,
    status: OrderStatus,
    entityManager?: EntityManager | undefined,
  ): Promise<void> {
    await this.executeQuery(
      async (repo) => await repo.update({ id }, { status }),
      entityManager,
    );
  }

  async create(
    entity: OrderEntity,
    entityManager?: EntityManager | undefined,
  ): Promise<OrderEntity> {
    return this.executeQuery(
      async (repo) => await repo.save(entity),
      entityManager,
    );
  }
}
