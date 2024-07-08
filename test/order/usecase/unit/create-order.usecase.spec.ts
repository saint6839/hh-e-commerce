import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  IOrderItemRepository,
  IOrderItemRepositoryToken,
} from 'src/order/domain/interface/repository/order-item.repository.interface';
import {
  IOrderRepository,
  IOrderRepositoryToken,
} from 'src/order/domain/interface/repository/order.repository.interface';
import { CreateOrderDto } from 'src/order/presentation/dto/request/create-order.dto';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import { OrderEntity } from 'src/order/repository/entity/order.entity';
import { CreateOrderUseCase } from 'src/order/usecase/create-order.usecase';
import { NOT_ENOUGH_STOCK_ERROR } from 'src/product/domain/entity/product';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import {
  NOT_FOUND_PRODUCT_ERROR,
  ProductEntity,
} from 'src/product/infrastructure/entity/product.entity';
import { DataSource, EntityManager } from 'typeorm';

describe('CreateOrderUseCase', () => {
  let createOrderUseCase: CreateOrderUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockOrderItemRepository: jest.Mocked<IOrderItemRepository>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    mockProductRepository = {
      findByIdWithLock: jest.fn(),
      updateStock: jest.fn(),
    } as any;

    mockOrderRepository = {
      create: jest.fn(),
    } as any;

    mockOrderItemRepository = {
      create: jest.fn(),
    } as any;

    mockEntityManager = {
      transaction: jest.fn(),
    } as any;

    mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        { provide: IProductRepositoryToken, useValue: mockProductRepository },
        { provide: IOrderRepositoryToken, useValue: mockOrderRepository },
        {
          provide: IOrderItemRepositoryToken,
          useValue: mockOrderItemRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  it('주문이 성공적으로 생성되어야 한다', async () => {
    const createOrderDto: CreateOrderDto = {
      userId: 1,
      products: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    };

    const mockProducts = [
      { id: 1, name: 'Product 1', price: 1000, stock: 10 },
      { id: 2, name: 'Product 2', price: 2000, stock: 5 },
    ];

    mockProductRepository.findByIdWithLock.mockImplementation((id) =>
      Promise.resolve(mockProducts.find((p) => p.id === id) as ProductEntity),
    );

    mockOrderRepository.create.mockResolvedValue({ id: 1 } as OrderEntity);
    mockOrderItemRepository.create.mockResolvedValue({} as OrderItemEntity);

    const result = await createOrderUseCase.execute(createOrderDto);

    expect(result).toBeDefined();
    expect(mockProductRepository.findByIdWithLock).toHaveBeenCalledTimes(2);
    expect(mockOrderRepository.create).toHaveBeenCalledTimes(1);
    expect(mockOrderItemRepository.create).toHaveBeenCalledTimes(2);
    expect(mockProductRepository.updateStock).toHaveBeenCalledTimes(2);
  });

  it('존재하지 않는 상품으로 주문 시 예외가 발생하는지 테스트', async () => {
    //given
    const createOrderDto: CreateOrderDto = {
      userId: 1,
      products: [{ productId: 999, quantity: 1 }],
    };
    mockProductRepository.findByIdWithLock.mockResolvedValue(null);

    //when & then
    await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR,
    );
  });

  it('재고가 부족한 경우 예외가 발생하는지 테스트', async () => {
    //given
    const createOrderDto: CreateOrderDto = {
      userId: 1,
      products: [{ productId: 1, quantity: 100 }],
    };

    mockProductRepository.findByIdWithLock.mockResolvedValue({
      id: 1,
      name: 'Product 1',
      price: 1000,
      stock: 10,
    } as ProductEntity);

    //when & then
    await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow(
      NOT_ENOUGH_STOCK_ERROR,
    );
  });

  it('주문 중 실패시 트랜잭션이 롤백되는지 테스트', async () => {
    //given
    const createOrderDto: CreateOrderDto = {
      userId: 1,
      products: [{ productId: 1, quantity: 1 }],
    };

    mockProductRepository.findByIdWithLock.mockResolvedValue({
      id: 1,
      name: 'Product 1',
      price: 1000,
      stock: 10,
    } as ProductEntity);
    mockOrderRepository.create.mockRejectedValue(new Error('DB Error'));

    //when
    await expect(createOrderUseCase.execute(createOrderDto)).rejects.toThrow(
      'DB Error',
    );
    //then
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('여러 상품 주문 시 총 가격이 올바르게 계산되는지 테스트', async () => {
    //given
    const createOrderDto: CreateOrderDto = {
      userId: 1,
      products: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 3 },
      ],
    };
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 1000, stock: 10 },
      { id: 2, name: 'Product 2', price: 2000, stock: 5 },
    ];
    mockProductRepository.findByIdWithLock.mockImplementation((id) =>
      Promise.resolve(mockProducts.find((p) => p.id === id) as ProductEntity),
    );
    mockOrderRepository.create.mockImplementation((order) => {
      expect(order.totalPrice).toBe(8000); // (1000 * 2) + (2000 * 3)
      return Promise.resolve({ ...order, id: 1 } as OrderEntity);
    });
    mockOrderItemRepository.create.mockResolvedValue({} as OrderItemEntity);

    //when
    await createOrderUseCase.execute(createOrderDto);

    //then
    expect(mockOrderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalPrice: 8000 }),
      expect.any(Object),
    );
  });
});
