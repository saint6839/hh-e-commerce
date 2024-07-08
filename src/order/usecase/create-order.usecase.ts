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
import { ICreateOrderFacadeUseCase } from '../domain/interface/usecase/create-order-facade.usecase.interface';
import { CreateOrderFacadeDto } from '../presentation/dto/request/create-order-facade.dto';
import { OrderDto } from '../presentation/dto/response/order-result.dto';
import { OrderItemEntity } from '../repository/entity/order-item.entity';
import { OrderEntity } from '../repository/entity/order.entity';

@Injectable()
export class CreateOrderUseCase implements ICreateOrderFacadeUseCase {
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
      let totalPrice = 0;
      const orderItems: OrderItemEntity[] = [];

      for (const productOption of dto.productOptions) {
        const productOptionEntity = await this.findProductOption(
          productOption.productOptionId,
          transactionEntityManager,
        );
        const productEntity = await this.findProduct(
          productOptionEntity.productId,
          transactionEntityManager,
        );

        const itemTotalPrice =
          productOptionEntity.price * productOption.quantity;
        totalPrice += itemTotalPrice;

        orderItems.push(
          OrderItemEntity.of(
            0, // 임시 orderId, 실제 orderId는 나중에 설정됩니다.
            productOptionEntity.id,
            productEntity.name,
            productOption.quantity,
            itemTotalPrice,
          ),
        );
      }

      const orderEntity = await this.orderRepository.create(
        OrderEntity.of(dto.userId, totalPrice),
        transactionEntityManager,
      );

      const createdOrderItems = await Promise.all(
        orderItems.map((item) => {
          item.orderId = orderEntity.id;
          return this.orderItemRepository.create(
            item,
            transactionEntityManager,
          );
        }),
      );

      return new OrderDto(
        orderEntity.id,
        orderEntity.userId,
        orderEntity.totalPrice,
        orderEntity.status,
        orderEntity.orderedAt,
        createdOrderItems.map((item) => OrderItem.fromEntity(item).toDto()),
      );
    };

    if (entityManager) {
      return await transactionCallback(entityManager);
    } else {
      return await this.dataSource.transaction(transactionCallback);
    }
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
