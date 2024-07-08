import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Product } from 'src/product/domain/entity/product';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import { NOT_FOUND_PRODUCT_ERROR } from 'src/product/infrastructure/entity/product.entity';
import { DataSource, EntityManager } from 'typeorm';
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
import { ICreateOrderUseCase } from '../domain/interface/usecase/create-order.usecase.interface';
import { CreateOrderDto } from '../presentation/dto/request/create-order.dto';
import { OrderDto } from '../presentation/dto/response/order-result.dto';
import { OrderItemEntity } from '../repository/entity/order-item.entity';
import { OrderEntity } from '../repository/entity/order.entity';

@Injectable()
export class CreateOrderUseCase implements ICreateOrderUseCase {
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    @Inject(IOrderRepositoryToken)
    private readonly orderRepository: IOrderRepository,
    @Inject(IOrderItemRepositoryToken)
    private readonly orderItemRepository: IOrderItemRepository,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderDto> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const products = await this.findValidateProducts(
        dto,
        transactionalEntityManager,
      );
      const order = await this.createOrder(
        dto,
        products,
        transactionalEntityManager,
      );
      await this.createOrderItems(
        dto,
        order,
        products,
        transactionalEntityManager,
      );
      await this.updateProductStocks(products, transactionalEntityManager);
      this.eventEmitter.emit('order.created', { orderId: order.id });
      return order.toDto();
    });
  }

  private async findValidateProducts(
    dto: CreateOrderDto,
    entityManager: EntityManager,
  ): Promise<Product[]> {
    const { products: orderProducts } = dto;
    return await Promise.all(
      orderProducts.map(async (orderProduct) => {
        const productEntity = await this.productRepository.findByIdWithLock(
          orderProduct.productId,
          entityManager,
        );
        if (!productEntity) {
          throw new Error(
            NOT_FOUND_PRODUCT_ERROR + ': ' + orderProduct.productId,
          );
        }
        const product = Product.fromEntity(productEntity);
        product.decreaseStock(orderProduct.quantity);
        return product;
      }),
    );
  }

  private async createOrder(
    dto: CreateOrderDto,
    products: Product[],
    entityManager: EntityManager,
  ): Promise<Order> {
    const { userId, products: orderProducts } = dto;
    const totalPrice = this.calculateTotalPrice(products, orderProducts);
    const orderEntity = OrderEntity.of(userId, totalPrice);
    const createdOrderEntity = await this.orderRepository.create(
      orderEntity,
      entityManager,
    );
    return Order.fromEntity(createdOrderEntity, []);
  }

  private async createOrderItems(
    dto: CreateOrderDto,
    order: Order,
    products: Product[],
    entityManager: EntityManager,
  ): Promise<void> {
    const { products: orderProducts } = dto;
    const orderItemEntities = products.map((product, index) => {
      const quantity = orderProducts[index].quantity;
      const totalPriceAtOrder = product.price * quantity;
      return OrderItemEntity.of(
        order.id,
        product.id,
        product.name,
        quantity,
        totalPriceAtOrder,
      );
    });

    const createdOrderItemEntities = await Promise.all(
      orderItemEntities.map(async (orderItemEntity) => {
        const entity = await this.orderItemRepository.create(
          orderItemEntity,
          entityManager,
        );
        return OrderItem.fromEntity(entity);
      }),
    );

    order.addOrderItems(createdOrderItemEntities);
  }

  private async updateProductStocks(
    products: Product[],
    entityManager: EntityManager,
  ): Promise<void> {
    await Promise.all(
      products.map((product) =>
        this.productRepository.updateStock(
          product.id,
          product.stock,
          entityManager,
        ),
      ),
    );
  }

  private calculateTotalPrice(
    products: Product[],
    orderProducts: CreateOrderDto['products'],
  ): number {
    return products.reduce((total, product, index) => {
      return total + product.price * orderProducts[index].quantity;
    }, 0);
  }
}
