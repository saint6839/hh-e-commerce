import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import { EntityManager } from 'typeorm';

export const IOrderItemRepositoryToken = Symbol('IOrderItemRepository');

export interface IOrderItemRepository {
  create(
    entity: OrderItemEntity,
    entityManager?: EntityManager,
  ): Promise<OrderItemEntity>;

  findByOrderId(
    orderId: number,
    entityManager?: EntityManager,
  ): Promise<OrderItemEntity[]>;
}
