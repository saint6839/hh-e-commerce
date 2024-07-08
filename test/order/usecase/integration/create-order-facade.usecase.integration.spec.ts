import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import {
  ICreateOrderFacadeUseCase,
  ICreateOrderFacadeUseCaseToken,
} from 'src/order/domain/interface/usecase/create-order-facade.usecase.interface';
import { CreateOrderFacadeDto } from 'src/order/presentation/dto/request/create-order-facade.dto';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import { OrderEntity } from 'src/order/repository/entity/order.entity';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { ProductOptionEntity } from 'src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('CreateOrderFacadeUseCase Integration Test', () => {
  let app: INestApplication;
  let createOrderFacadeUseCase: ICreateOrderFacadeUseCase;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;
  let orderRepository: Repository<OrderEntity>;
  let orderItemRepository: Repository<OrderItemEntity>;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    createOrderFacadeUseCase = moduleFixture.get(
      ICreateOrderFacadeUseCaseToken,
    );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
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
    await productOptionRepository.clear();
    await productRepository.clear();
    await userRepository.clear();
  });

  it('주문이 성공적으로 생성되고 재고가 감소하는지 테스트', async () => {
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
      stock: 10,
      productId: product.id,
    });

    const createOrderDto: CreateOrderFacadeDto = {
      userId: user.id,
      productOptions: [{ productOptionId: productOption.id, quantity: 2 }],
    };

    // when
    const result = await createOrderFacadeUseCase.execute(createOrderDto);

    // then
    expect(result).toBeDefined();
    expect(result.userId).toBe(user.id);
    expect(result.totalPrice).toBe(2000);
    expect(result.status).toBe(OrderStatus.PENDING_PAYMENT);

    const savedOrder = await orderRepository.findOne({
      where: { id: result.id },
    });
    expect(savedOrder).toBeDefined();
    expect(savedOrder?.status).toBe(OrderStatus.PENDING_PAYMENT);

    const savedOrderItems = await orderItemRepository.find({
      where: { orderId: result.id },
    });
    expect(savedOrderItems).toHaveLength(1);
    expect(savedOrderItems[0].productOptionId).toBe(productOption.id);
    expect(savedOrderItems[0].quantity).toBe(2);

    const updatedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });
    expect(updatedProductOption?.stock).toBe(8);
  });

  it('재고가 부족한 경우 주문이 생성되지 않고 예외가 발생하는지 테스트', async () => {
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
      stock: 1,
      productId: product.id,
    });

    const createOrderDto: CreateOrderFacadeDto = {
      userId: user.id,
      productOptions: [{ productOptionId: productOption.id, quantity: 2 }],
    };

    // when & then
    await expect(
      createOrderFacadeUseCase.execute(createOrderDto),
    ).rejects.toThrow();

    const orders = await orderRepository.find();
    expect(orders).toHaveLength(0);

    const updatedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });
    expect(updatedProductOption?.stock).toBe(1);
  });

  it('존재하지 않는 상품 옵션으로 주문 시 예외가 발생하는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    const createOrderDto: CreateOrderFacadeDto = {
      userId: user.id,
      productOptions: [{ productOptionId: 999, quantity: 1 }],
    };

    // when & then
    await expect(
      createOrderFacadeUseCase.execute(createOrderDto),
    ).rejects.toThrow();

    const orders = await orderRepository.find();
    expect(orders).toHaveLength(0);
  });
});
