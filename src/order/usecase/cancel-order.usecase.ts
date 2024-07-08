import { Inject, Injectable } from '@nestjs/common';
import { ProductOption } from 'src/product/domain/entity/product-option';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from 'src/product/domain/interface/repository/product-option.repository.interface';
import { DataSource } from 'typeorm';
import { Order } from '../domain/entity/order';
import { OrderItem } from '../domain/entity/order-item';
import { OrderStatus } from '../domain/enum/order-status.enum';
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
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    private dataSource: DataSource,
  ) {}

  async execute(orderId: number): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const order = await this.findAndValidateOrder(
        orderId,
        transactionalEntityManager,
      );
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return;
      }

      await this.cancelOrder(order, transactionalEntityManager);
      await this.restoreProductOptionStock(order, transactionalEntityManager);
    });
  }

  private async findAndValidateOrder(
    orderId: number,
    entityManager,
  ): Promise<Order> {
    const orderEntity = await this.orderRepository.findById(
      orderId,
      entityManager,
    );

    if (!orderEntity) {
      throw new Error(NOT_FOUND_ORDER_ERROR);
    }

    return Order.fromEntity(orderEntity);
  }

  private async cancelOrder(order: Order, entityManager): Promise<void> {
    order.cancel();
    await this.orderRepository.updateStatus(
      order.id,
      order.status,
      entityManager,
    );
  }

  private async restoreProductOptionStock(
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
    return orderItemEntities.map((entity) => OrderItem.fromEntity(entity));
  }

  private async restoreStockForOrderItem(
    orderItem: OrderItem,
    entityManager,
  ): Promise<void> {
    const productOption = await this.findProductOptionWithLock(
      orderItem.productOptionId,
      entityManager,
    );
    productOption.restoreStock(orderItem.quantity);
    await this.productOptionRepository.updateStock(
      productOption.id,
      productOption.stock,
      entityManager,
    );
  }

  private async findProductOptionWithLock(
    productOptionId: number,
    entityManager,
  ): Promise<ProductOption> {
    const productOptionEntity =
      await this.productOptionRepository.findByIdWithLock(
        productOptionId,
        entityManager,
      );

    if (!productOptionEntity) {
      throw new Error(NOT_FOUND_ORDER_ERROR);
    }

    return ProductOption.fromEntity(productOptionEntity);
  }
}
