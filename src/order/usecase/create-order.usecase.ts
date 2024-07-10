import { Inject, Injectable } from '@nestjs/common';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from 'src/product/domain/interface/repository/product-option.repository.interface';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from 'src/product/infrastructure/entity/product-option.entity';
import { NOT_FOUND_PRODUCT_ERROR } from 'src/product/infrastructure/entity/product.entity';
import { DataSource, EntityManager } from 'typeorm';
import { OrderItem } from '../domain/entity/order-item';
import {
  IOrderItemRepository,
  IOrderItemRepositoryToken,
} from '../domain/interface/repository/order-item.repository.interface';
import {
  IOrderRepository,
  IOrderRepositoryToken,
} from '../domain/interface/repository/order.repository.interface';
import { ICreateOrderUseCase } from '../domain/interface/usecase/create-order.uscase.interface';
import { CreateOrderFacadeDto } from '../presentation/dto/request/create-order-facade.dto';
import { OrderDto } from '../presentation/dto/response/order-result.dto';
import { OrderItemEntity } from '../repository/entity/order-item.entity';
import { OrderEntity } from '../repository/entity/order.entity';

@Injectable()
export class CreateOrderUseCase implements ICreateOrderUseCase {
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    @Inject(IOrderRepositoryToken)
    private readonly orderRepository: IOrderRepository,
    @Inject(IOrderItemRepositoryToken)
    private readonly orderItemRepository: IOrderItemRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    dto: CreateOrderFacadeDto,
    entityManager?: EntityManager,
  ): Promise<OrderDto> {
    const transactionCallback = async (
      transactionEntityManager: EntityManager,
    ) => {
      const { totalPrice, orderItems } = await this.prepareOrderItems(
        dto,
        transactionEntityManager,
      );

      const orderEntity = await this.createOrder(
        dto.userId,
        totalPrice,
        transactionEntityManager,
      );

      const createdOrderItems = await this.createOrderItems(
        orderItems,
        orderEntity.id,
        transactionEntityManager,
      );

      return this.createOrderDto(orderEntity, createdOrderItems);
    };

    if (entityManager) {
      return await transactionCallback(entityManager);
    } else {
      return await this.dataSource.transaction(transactionCallback);
    }
  }

  private async prepareOrderItems(
    dto: CreateOrderFacadeDto,
    entityManager: EntityManager,
  ) {
    let totalPrice = 0;
    const orderItems: OrderItemEntity[] = [];

    for (const productOption of dto.productOptions) {
      const { productOptionEntity, productEntity } =
        await this.findProductAndOption(
          productOption.productOptionId,
          entityManager,
        );

      const itemTotalPrice = productOptionEntity.price * productOption.quantity;
      totalPrice += itemTotalPrice;

      orderItems.push(
        OrderItemEntity.of(
          0,
          productOptionEntity.id,
          productEntity.name,
          productOption.quantity,
          itemTotalPrice,
        ),
      );
    }

    return { totalPrice, orderItems };
  }

  private async findProductAndOption(
    productOptionId: number,
    entityManager: EntityManager,
  ) {
    const productOptionEntity = await this.findProductOption(
      productOptionId,
      entityManager,
    );
    const productEntity = await this.findProduct(
      productOptionEntity.productId,
      entityManager,
    );

    return { productOptionEntity, productEntity };
  }

  private async createOrder(
    userId: number,
    totalPrice: number,
    entityManager: EntityManager,
  ) {
    return await this.orderRepository.create(
      OrderEntity.of(userId, totalPrice),
      entityManager,
    );
  }

  private async createOrderItems(
    orderItems: OrderItemEntity[],
    orderId: number,
    entityManager: EntityManager,
  ) {
    return await Promise.all(
      orderItems.map((item) => {
        item.orderId = orderId;
        return this.orderItemRepository.create(item, entityManager);
      }),
    );
  }

  private createOrderDto(
    orderEntity: OrderEntity,
    createdOrderItems: OrderItemEntity[],
  ) {
    return new OrderDto(
      orderEntity.id,
      orderEntity.userId,
      orderEntity.totalPrice,
      orderEntity.status,
      orderEntity.orderedAt,
      createdOrderItems.map((item) => OrderItem.fromEntity(item).toDto()),
    );
  }

  private async findProductOption(
    productOptionId: number,
    entityManager: EntityManager,
  ) {
    const productOptionEntity = await this.productOptionRepository.findById(
      productOptionId,
      entityManager,
    );
    if (!productOptionEntity) {
      throw new Error(NOT_FOUND_PRODUCT_OPTION_ERROR + ': ' + productOptionId);
    }
    return productOptionEntity;
  }

  private async findProduct(productId: number, entityManager: EntityManager) {
    const productEntity = await this.productRepository.findById(
      productId,
      entityManager,
    );
    if (!productEntity) {
      throw new Error(NOT_FOUND_PRODUCT_ERROR + ': ' + productId);
    }
    return productEntity;
  }
}
