import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { IOrderItemRepositoryToken } from 'src/order/domain/interface/repository/order-item.repository.interface';
import { IOrderRepositoryToken } from 'src/order/domain/interface/repository/order.repository.interface';
import { CreateOrderFacadeDto } from 'src/order/presentation/dto/request/create-order-facade.dto';
import { CreateOrderUseCase } from 'src/order/usecase/create-order.usecase';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { IPaymentRepositoryToken } from 'src/payment/domain/interface/repository/payment.repository.interface';
import { IProductOptionRepositoryToken } from 'src/product/domain/interface/repository/product-option.repository.interface';
import { IProductRepositoryToken } from 'src/product/domain/interface/repository/product.repository.interface';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from 'src/product/infrastructure/entity/product-option.entity';
import { NOT_FOUND_PRODUCT_ERROR } from 'src/product/infrastructure/entity/product.entity';
import { DataSource, EntityManager } from 'typeorm';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockProductRepository: any;
  let mockProductOptionRepository: any;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockPaymentRepository: any;
  let mockDataSource: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockProductRepository = {
      findById: jest.fn(),
    };
    mockProductOptionRepository = {
      findById: jest.fn(),
    };
    mockOrderRepository = {
      create: jest.fn(),
    };
    mockOrderItemRepository = {
      create: jest.fn(),
    };
    mockPaymentRepository = {
      create: jest.fn(),
    };
    mockEntityManager = {
      transaction: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((cb) => cb(mockEntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        { provide: IProductRepositoryToken, useValue: mockProductRepository },
        {
          provide: IProductOptionRepositoryToken,
          useValue: mockProductOptionRepository,
        },
        { provide: IOrderRepositoryToken, useValue: mockOrderRepository },
        {
          provide: IOrderItemRepositoryToken,
          useValue: mockOrderItemRepository,
        },
        {
          provide: IPaymentRepositoryToken,
          useValue: mockPaymentRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  it('주문이 성공적으로 생성되는지 테스트', async () => {
    const dto: CreateOrderFacadeDto = {
      userId: 1,
      productOptions: [
        { productOptionId: 1, quantity: 2 },
        { productOptionId: 2, quantity: 1 },
      ],
    };

    mockProductOptionRepository.findById
      .mockResolvedValueOnce({ id: 1, productId: 10, price: 1000 })
      .mockResolvedValueOnce({ id: 2, productId: 20, price: 2000 });

    mockProductRepository.findById
      .mockResolvedValueOnce({ id: 10, name: 'Product 1' })
      .mockResolvedValueOnce({ id: 20, name: 'Product 2' });

    mockOrderRepository.create.mockResolvedValue({
      id: 1,
      userId: 1,
      totalPrice: 4000,
      status: OrderStatus.PENDING_PAYMENT,
      orderedAt: new Date(),
    });

    mockOrderItemRepository.create
      .mockResolvedValueOnce({
        id: 1,
        orderId: 1,
        productOptionId: 1,
        productName: 'Product 1',
        quantity: 2,
        price: 2000,
      })
      .mockResolvedValueOnce({
        id: 2,
        orderId: 1,
        productOptionId: 2,
        productName: 'Product 2',
        quantity: 1,
        price: 2000,
      });

    mockPaymentRepository.create.mockResolvedValue({
      id: 1,
      userId: 1,
      orderId: 1,
      amount: 4000,
      status: PaymentStatus.PENDING,
    });

    const result = await useCase.execute(dto);
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.userId).toBe(1);
    expect(result.totalPrice).toBe(4000);
    expect(result.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(result.orderItems).toHaveLength(2);
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 상품 옵션에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: CreateOrderFacadeDto = {
      userId: 1,
      productOptions: [{ productOptionId: 999, quantity: 1 }],
    };

    mockProductOptionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_OPTION_ERROR + ': 999',
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 상품에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: CreateOrderFacadeDto = {
      userId: 1,
      productOptions: [{ productOptionId: 1, quantity: 1 }],
    };

    mockProductOptionRepository.findById.mockResolvedValue({
      id: 1,
      productId: 999,
    });
    mockProductRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR + ': 999',
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('이미 트랜잭션이 시작된 경우 새 트랜잭션을 시작하지 않는지 테스트', async () => {
    const dto: CreateOrderFacadeDto = {
      userId: 1,
      productOptions: [{ productOptionId: 1, quantity: 1 }],
    };

    mockProductOptionRepository.findById.mockResolvedValue({
      id: 1,
      productId: 10,
      price: 1000,
    });
    mockProductRepository.findById.mockResolvedValue({
      id: 10,
      name: 'Product 1',
    });
    mockOrderRepository.create.mockResolvedValue({
      id: 1,
      userId: 1,
      totalPrice: 1000,
      status: OrderStatus.PENDING_PAYMENT,
      orderedAt: new Date(),
    });
    mockOrderItemRepository.create.mockResolvedValue({
      id: 1,
      orderId: 1,
      productOptionId: 1,
      productName: 'Product 1',
      quantity: 1,
      price: 1000,
    });

    const existingEntityManager = {} as EntityManager;
    await useCase.execute(dto, existingEntityManager);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(mockProductOptionRepository.findById).toHaveBeenCalledWith(
      1,
      existingEntityManager,
    );
    expect(mockProductRepository.findById).toHaveBeenCalledWith(
      10,
      existingEntityManager,
    );
    expect(mockOrderRepository.create).toHaveBeenCalledWith(
      expect.anything(),
      existingEntityManager,
    );
    expect(mockOrderItemRepository.create).toHaveBeenCalledWith(
      expect.anything(),
      existingEntityManager,
    );
  });
});
