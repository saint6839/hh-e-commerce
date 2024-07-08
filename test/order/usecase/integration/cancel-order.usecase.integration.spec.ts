import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import {
  ICancelOrderUseCase,
  ICancelOrderUseCaseToken,
} from 'src/order/domain/interface/usecase/cancel-order.usecase.interface';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import {
  NOT_FOUND_ORDER_ERROR,
  OrderEntity,
} from 'src/order/repository/entity/order.entity';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { ProductOptionEntity } from 'src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('CancelOrderUseCase Integration Test', () => {
  let app: INestApplication;
  let cancelOrderUseCase: ICancelOrderUseCase;
  let orderRepository: Repository<OrderEntity>;
  let orderItemRepository: Repository<OrderItemEntity>;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    cancelOrderUseCase = moduleFixture.get<ICancelOrderUseCase>(
      ICancelOrderUseCaseToken,
    );
    orderRepository = moduleFixture.get(getRepositoryToken(OrderEntity));
    orderItemRepository = moduleFixture.get(
      getRepositoryToken(OrderItemEntity),
    );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await orderItemRepository.clear();
    await orderRepository.clear();
    await productOptionRepository.clear();
    await productRepository.clear();
    await userRepository.clear();
  });

  it('주문 취소가 성공적으로 이루어지는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    const product = await productRepository.save({
      name: 'Test Product',
      status: ProductStatus.ACTIVATE,
    });

    const productOption = await productOptionRepository.save({
      name: 'Test Option',
      price: 1000,
      stock: 8,
      productId: product.id,
    });

    const order = await orderRepository.save({
      userId: user.id,
      totalPrice: 2000,
      status: OrderStatus.PENDING_PAYMENT,
    });

    await orderItemRepository.save({
      orderId: order.id,
      productId: product.id,
      productOptionId: productOption.id,
      productName: product.name,
      quantity: 2,
      totalPriceAtOrder: 2000,
    });

    // when
    await cancelOrderUseCase.execute(order.id);

    // then
    const cancelledOrder = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(cancelledOrder).toBeDefined();
    expect(cancelledOrder?.status).toBe(OrderStatus.CANCELLED);

    const updatedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });
    expect(updatedProductOption).toBeDefined();
    expect(updatedProductOption?.stock).toBe(10);
  });

  it('존재하지 않는 주문에 대해 취소를 시도할 경우 예외가 발생하는지 테스트', async () => {
    // when & then
    await expect(cancelOrderUseCase.execute(999)).rejects.toThrow(
      NOT_FOUND_ORDER_ERROR,
    );
  });

  it('이미 취소된 주문에 대해 취소를 시도할 경우 아무 변화가 없는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    const order = await orderRepository.save({
      userId: user.id,
      totalPrice: 2000,
      status: OrderStatus.CANCELLED,
    });

    // when
    await cancelOrderUseCase.execute(order.id);

    // then
    const unchangedOrder = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(unchangedOrder).toBeDefined();
    expect(unchangedOrder?.status).toBe(OrderStatus.CANCELLED);
  });

  it('결제 완료된 주문에 대해 취소를 시도할 경우 아무 변화가 없는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    const order = await orderRepository.save({
      userId: user.id,
      totalPrice: 2000,
      status: OrderStatus.PAID,
    });

    // when
    await cancelOrderUseCase.execute(order.id);

    // then
    const unchangedOrder = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(unchangedOrder).toBeDefined();
    expect(unchangedOrder?.status).toBe(OrderStatus.PAID);
  });
});
