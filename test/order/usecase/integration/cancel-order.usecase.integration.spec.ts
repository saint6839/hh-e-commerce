import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import {
  ICancelOrderUseCase,
  ICancelOrderUseCaseToken,
} from 'src/order/domain/interface/usecase/cancel-order.usecase.interface';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import { OrderEntity } from 'src/order/repository/entity/order.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('CancelOrderUseCase Integration Test', () => {
  let app: INestApplication;
  let cancelOrderUseCase: ICancelOrderUseCase;
  let productRepository: Repository<ProductEntity>;
  let orderRepository: Repository<OrderEntity>;
  let orderItemRepository: Repository<OrderItemEntity>;
  let userRepository: Repository<UserEntity>;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    cancelOrderUseCase = moduleFixture.get(ICancelOrderUseCaseToken);
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    orderRepository = moduleFixture.get(getRepositoryToken(OrderEntity));
    orderItemRepository = moduleFixture.get(
      getRepositoryToken(OrderItemEntity),
    );
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await orderItemRepository.clear();
    await orderRepository.clear();
    await productRepository.clear();
    await userRepository.clear();
  });

  it('주문 취소가 성공적으로 이루어지는지 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: 'Test Product',
      price: 1000,
      stock: 10,
      deletedAt: null,
    });

    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    const order = await orderRepository.save({
      userId: user.id,
      totalPrice: 2000,
      status: OrderStatus.PENDING_PAYMENT,
    });

    const orderItems = await orderItemRepository.save([
      {
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        quantity: 2,
        totalPriceAtOrder: 2000,
        deletedAt: null,
      },
    ]);

    // when
    await cancelOrderUseCase.execute(order.id);

    // then
    const cancelledOrder = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(cancelledOrder).toBeDefined();
    expect(cancelledOrder?.status).toBe(OrderStatus.CANCELLED);

    const updatedProduct = await productRepository.findOne({
      where: { id: product.id },
    });
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct?.stock).toBe(12); // 원래 재고 10 + 취소된 주문 수량 2
  });
});
