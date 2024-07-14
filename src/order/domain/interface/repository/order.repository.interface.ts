import { OrderEntity } from 'src/order/repository/entity/order.entity';
import { EntityManager } from 'typeorm';
import { OrderStatus } from '../../enum/order-status.enum';

export const IOrderRepositoryToken = Symbol('IOrderRepository');

export interface IOrderRepository {
  create(
    entity: OrderEntity,
    entityManager?: EntityManager,
  ): Promise<OrderEntity>;

  findById(
    id: number,
    entityManager?: EntityManager,
  ): Promise<OrderEntity | null>;

  updateStatus(
    id: number,
    status: OrderStatus,
    entityManager?: EntityManager,
  ): Promise<void>;
}
