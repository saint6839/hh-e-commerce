import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from 'src/common/logger/logger.service';
import { Order } from 'src/order/domain/entity/order';
import { OrderItem } from 'src/order/domain/entity/order-item';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { IOrderItemRepositoryToken } from 'src/order/domain/interface/repository/order-item.repository.interface';
import { IOrderRepositoryToken } from 'src/order/domain/interface/repository/order.repository.interface';
import { NOT_FOUND_ORDER_ERROR } from 'src/order/repository/entity/order.entity';
import { CancelOrderUseCase } from 'src/order/usecase/cancel-order.usecase';
import { ProductOption } from 'src/product/domain/entity/product-option';
import { IProductOptionRepositoryToken } from 'src/product/domain/interface/repository/product-option.repository.interface';
import { DataSource } from 'typeorm';

describe('CancelOrderUseCase', () => {
  let cancelOrderUseCase: CancelOrderUseCase;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockProductOptionRepository: any;
  let mockDataSource: any;
  let mockLoggerService: any;

  beforeEach(async () => {
    mockOrderRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockOrderItemRepository = {
      findByOrderId: jest.fn(),
    };
    mockProductOptionRepository = {
      findByIdWithLock: jest.fn(),
      updateStock: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback('mockEntityManager')),
    };
    mockLoggerService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelOrderUseCase,
        { provide: IOrderRepositoryToken, useValue: mockOrderRepository },
        {
          provide: IOrderItemRepositoryToken,
          useValue: mockOrderItemRepository,
        },
        {
          provide: IProductOptionRepositoryToken,
          useValue: mockProductOptionRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    cancelOrderUseCase = module.get<CancelOrderUseCase>(CancelOrderUseCase);
  });

  it('주문 취소가 성공적으로 이루어지는지 테스트', async () => {
    const mockOrder = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
      cancel: jest.fn().mockImplementation(function () {
        this.status = OrderStatus.CANCELLED;
      }),
    };
    const mockOrderItems = [
      { productOptionId: 1, quantity: 2 },
      { productOptionId: 2, quantity: 3 },
    ];
    const mockProductOptions = [
      { id: 1, stock: 10, restoreStock: jest.fn() },
      { id: 2, stock: 20, restoreStock: jest.fn() },
    ];

    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockProductOptionRepository.findByIdWithLock.mockImplementation((id) =>
      Promise.resolve(mockProductOptions.find((option) => option.id === id)),
    );

    jest.spyOn(Order, 'fromEntity').mockReturnValue(mockOrder as any);
    jest
      .spyOn(OrderItem, 'fromEntity')
      .mockImplementation((item) => item as any);
    jest
      .spyOn(ProductOption, 'fromEntity')
      .mockImplementation((option) => option as any);

    await cancelOrderUseCase.execute(1);

    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(mockOrderRepository.findById).toHaveBeenCalledWith(
      1,
      'mockEntityManager',
    );
    expect(mockOrder.cancel).toHaveBeenCalled();
    expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
      1,
      OrderStatus.CANCELLED,
      'mockEntityManager',
    );
    expect(mockOrderItemRepository.findByOrderId).toHaveBeenCalledWith(
      1,
      'mockEntityManager',
    );
    expect(mockProductOptionRepository.findByIdWithLock).toHaveBeenCalledTimes(
      2,
    );
    expect(mockProductOptions[0].restoreStock).toHaveBeenCalledWith(2);
    expect(mockProductOptions[1].restoreStock).toHaveBeenCalledWith(3);
    expect(mockProductOptionRepository.updateStock).toHaveBeenCalledTimes(2);
  });
  it('주문이 존재하지 않을 경우 예외가 발생하는지 테스트', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(cancelOrderUseCase.execute(999)).rejects.toThrow(
      NOT_FOUND_ORDER_ERROR,
    );
  });

  it('주문 상태가 PENDING_PAYMENT가 아닌 경우 취소되지 않는지 테스트', async () => {
    const mockOrder = {
      id: 1,
      status: OrderStatus.SHIPPED,
      cancel: jest.fn(),
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    jest.spyOn(Order, 'fromEntity').mockReturnValue(mockOrder as any);

    await cancelOrderUseCase.execute(1);

    expect(mockOrder.cancel).not.toHaveBeenCalled();
    expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
  });

  it('상품 옵션이 존재하지 않을 경우 예외가 발생하는지 테스트', async () => {
    const mockOrder = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
      cancel: jest.fn(),
    };
    const mockOrderItems = [{ productOptionId: 1, quantity: 2 }];

    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockProductOptionRepository.findByIdWithLock.mockResolvedValue(null);

    jest.spyOn(Order, 'fromEntity').mockReturnValue(mockOrder as any);
    jest
      .spyOn(OrderItem, 'fromEntity')
      .mockImplementation((item) => item as any);

    await expect(cancelOrderUseCase.execute(1)).rejects.toThrow(
      NOT_FOUND_ORDER_ERROR,
    );
  });
});
