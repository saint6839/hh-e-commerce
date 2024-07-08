import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { ICreateOrderUseCaseToken } from 'src/order/domain/interface/usecase/create-order.usecase.interface';
import { OrderEventListener } from 'src/order/listener/order-event.listener';
import { CreateOrderDto } from 'src/order/presentation/dto/request/create-order.dto';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import { OrderEntity } from 'src/order/repository/entity/order.entity';
import { CreateOrderUseCase } from 'src/order/usecase/create-order.usecase';
import { NOT_ENOUGH_STOCK_ERROR } from 'src/product/domain/entity/product';
import {
  NOT_FOUND_PRODUCT_ERROR,
  ProductEntity,
} from 'src/product/infrastructure/entity/product.entity';
import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { setupTestingModule } from 'test/common/setup';
import { DataSource, Repository } from 'typeorm';

describe('CreateOrderUseCase Integration Test', () => {
  let app: INestApplication;
  let createOrderUseCase: CreateOrderUseCase;
  let productRepository: Repository<ProductEntity>;
  let orderRepository: Repository<OrderEntity>;
  let orderItemRepository: Repository<OrderItemEntity>;
  let userRepository: Repository<UserEntity>;
  let eventEmitter: EventEmitter2;
  let orderEventListener: OrderEventListener;
  let dataSource: DataSource;

  let user: UserEntity;
  let product: ProductEntity;
  let product2: ProductEntity;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    createOrderUseCase = moduleFixture.get(ICreateOrderUseCaseToken);
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    orderRepository = moduleFixture.get(getRepositoryToken(OrderEntity));
    orderItemRepository = moduleFixture.get(
      getRepositoryToken(OrderItemEntity),
    );
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    eventEmitter = moduleFixture.get(EventEmitter2);
    orderEventListener = moduleFixture.get(OrderEventListener);
    dataSource = moduleFixture.get(DataSource);
    user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });
  });

  afterAll(async () => {
    await productRepository.clear();
    await orderRepository.clear();
    await orderItemRepository.clear();
    eventEmitter.removeAllListeners();
    await app.close();
  });

  beforeEach(async () => {
    user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    product = await productRepository.save({
      name: 'Test Product',
      price: 1000,
      stock: 10,
    });

    product2 = await productRepository.save({
      name: 'Test Product 2',
      price: 2000,
      stock: 20,
    });
  });

  it('요청한 상품의 금액과 수량 만큼 주문이 성공적으로 생성되는지 테스트', async () => {
    //given
    const createOrderDto: CreateOrderDto = {
      userId: user.id,
      products: [{ productId: product.id, quantity: 2 }],
    };

    //when
    const result = await createOrderUseCase.execute(createOrderDto);

    //then
    expect(result).toBeDefined();
    expect(result.userId).toBe(user.id);
    expect(result.totalPrice).toBe(2000);

    const updatedProduct = await productRepository.findOne({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(8);

    const orderItems = await orderItemRepository.find({
      where: { orderId: result.id },
    });
    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].productId).toBe(product.id);
    expect(orderItems[0].quantity).toBe(2);
  });

  it('존재하지 않는 상품으로 주문 시 예외가 발생하는지 테스트', async () => {
    //given
    const createOrderDto: CreateOrderDto = {
      userId: user.id,
      products: [{ productId: 999, quantity: 1 }],
    };

    //when & then
    await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR,
    );
  });

  it('재고가 부족한 경우 에러가 발생해야 한다', async () => {
    //given
    const createOrderDto: CreateOrderDto = {
      userId: user.id,
      products: [{ productId: product.id, quantity: 15 }],
    };

    //when & then
    await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow(
      NOT_ENOUGH_STOCK_ERROR,
    );
  });

  it('동시에 여러 사용자의 주문이 들어와도 재고가 정확하게 감소하는지 테스트', async () => {
    //given
    const initialStock = 20;

    const users = await Promise.all(
      Array(10)
        .fill(null)
        .map((_, index) =>
          userRepository.save({
            name: `Test User ${index + 1}`,
            balance: 10000,
          }),
        ),
    );

    //when
    const orderPromises = users.map((user) =>
      createOrderUseCase.execute({
        userId: user.id,
        products: [{ productId: product2.id, quantity: 1 }],
      }),
    );
    const results = await Promise.allSettled(orderPromises);

    //then
    const successfulOrders = results.filter(
      (result) => result.status === 'fulfilled',
    );

    const updatedProduct = await productRepository.findOne({
      where: { id: product2.id },
    });
    expect(updatedProduct?.stock).toBe(initialStock - successfulOrders.length);
    expect(successfulOrders.length).toBeLessThanOrEqual(initialStock);
  });

  it('재고보다 더 많은 사용자가 동시 주문 시 재고만큼의 사용자는 주문에 성공하고 나머지는 주문에 실패하는지 테스트', async () => {
    //given

    const users = await Promise.all(
      Array(15)
        .fill(null)
        .map((_, index) =>
          userRepository.save({
            name: `Test User ${index + 1}`,
            balance: 10000,
          }),
        ),
    );

    //when
    const orderPromises = users.map((user) =>
      createOrderUseCase.execute({
        userId: user.id,
        products: [{ productId: product.id, quantity: 1 }],
      }),
    );
    const results = await Promise.allSettled(orderPromises);

    //then
    const successfulOrders = results.filter((r) => r.status === 'fulfilled');
    const failedOrders = results.filter((r) => r.status === 'rejected');

    expect(successfulOrders).toHaveLength(10);
    expect(failedOrders).toHaveLength(5);

    const updatedProduct = await productRepository.findOne({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(0);
  });

  it('주문 생성 후 이벤트가 발생하고 주문이 취소되는지 테스트', async () => {
    // given
    const createOrderDto: CreateOrderDto = {
      userId: user.id,
      products: [{ productId: product.id, quantity: 2 }],
    };
    orderEventListener.setCancelDelay(100);

    // when
    const result = await createOrderUseCase.execute(createOrderDto);

    // then
    expect(result).toBeDefined();
    expect(result.userId).toBe(user.id);
    expect(result.totalPrice).toBe(2000);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const cancelledOrder = await orderRepository.findOne({
      where: { id: result.id },
    });
    expect(cancelledOrder?.status).toBe(OrderStatus.CANCELLED);

    const updatedProduct = await productRepository.findOne({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(10); // 재고가 원래대로 복구되었는지 확인
  });
});
