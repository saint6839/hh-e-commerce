import { Inject, Injectable } from '@nestjs/common';
import { Product } from 'src/product/domain/entity/product';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import { DataSource } from 'typeorm';
import { Order } from '../domain/entity/order';
import { OrderItem } from '../domain/entity/order-item';
import {
  IOrderItemRepository,
  IOrderItemRepositoryToken,
} from '../domain/interface/repository/order-item.repository.interface';
import {
  IOrderRepository,
  IOrderRepositoryToken,
} from '../domain/interface/repository/order.repository.interface';
import { ICancelOrderUseCase } from '../domain/interface/usecase/cancel-order.usecase.interface';
import { NOT_FOUND_ORDER_ERROR } from '../repository/entity/order.entity';

@Injectable()
export class CancelOrderUseCase implements ICancelOrderUseCase {
  constructor(
    @Inject(IOrderRepositoryToken)
    private readonly orderRepository: IOrderRepository,
    @Inject(IOrderItemRepositoryToken)
    private readonly orderItemRepository: IOrderItemRepository,
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    private dataSource: DataSource,
  ) {}

  async execute(orderId: number): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const order = await this.findAndValidateOrder(
        orderId,
        transactionalEntityManager,
      );
      if (!order) return;

      await this.cancelOrder(order, transactionalEntityManager);
      await this.restoreProductStock(order, transactionalEntityManager);
    });
  }

  private async findAndValidateOrder(
    orderId: number,
    entityManager,
  ): Promise<Order | null> {
    const orderEntity = await this.orderRepository.findById(
      orderId,
      entityManager,
    );

    if (!orderEntity) {
      throw new Error(NOT_FOUND_ORDER_ERROR);
    }

    return null;
  }

  private async cancelOrder(order: Order, entityManager): Promise<void> {
    // order.cancel();
    await this.orderRepository.updateStatus(
      order.id,
      order.status,
      entityManager,
    );
  }

  private async restoreProductStock(
    order: Order,
    entityManager,
  ): Promise<void> {
    const orderItems = await this.findOrderItems(order.id, entityManager);
    for (const orderItem of orderItems) {
      await this.restoreStockForOrderItem(orderItem, entityManager);
    }
  }

  private async findOrderItems(
    orderId: number,
    entityManager,
  ): Promise<OrderItem[]> {
    const orderItemEntities = await this.orderItemRepository.findByOrderId(
      orderId,
      entityManager,
    );
    return [];
  }

  private async restoreStockForOrderItem(
    orderItem: OrderItem,
    entityManager,
  ): Promise<void> {
    const product = await this.findProductWithLock(
      orderItem.productId,
      entityManager,
    );
    if (product) {
      return;
    }
  }

  private async findProductWithLock(
    productId: number,
    entityManager,
  ): Promise<Product | null> {
    return null;
  }
}
