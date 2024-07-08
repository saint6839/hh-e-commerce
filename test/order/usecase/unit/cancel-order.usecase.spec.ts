import { Test, TestingModule } from '@nestjs/testing';
import { Order } from 'src/order/domain/entity/order';
import { OrderItem } from 'src/order/domain/entity/order-item';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { IOrderItemRepositoryToken } from 'src/order/domain/interface/repository/order-item.repository.interface';
import { IOrderRepositoryToken } from 'src/order/domain/interface/repository/order.repository.interface';
import { CancelOrderUseCase } from 'src/order/usecase/cancel-order.usecase';
import { Product } from 'src/product/domain/entity/product';
import { IProductRepositoryToken } from 'src/product/domain/interface/repository/product.repository.interface';
import { DataSource } from 'typeorm';

describe('CancelOrderUseCase', () => {
  let cancelOrderUseCase: CancelOrderUseCase;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockProductRepository: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockOrderRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockOrderItemRepository = {
      findByOrderId: jest.fn(),
    };

    mockProductRepository = {
      findByIdWithLock: jest.fn(),
      updateStock: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn((callback) => callback('mockEntityManager')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelOrderUseCase,
        { provide: IOrderRepositoryToken, useValue: mockOrderRepository },
        {
          provide: IOrderItemRepositoryToken,
          useValue: mockOrderItemRepository,
        },
        { provide: IProductRepositoryToken, useValue: mockProductRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    cancelOrderUseCase = module.get<CancelOrderUseCase>(CancelOrderUseCase);
  });

  it('should be defined', () => {
    expect(cancelOrderUseCase).toBeDefined();
  });

  it('상태가 결제 대기중일 경우 주문이 잘 취소 되는지 테스트', async () => {
    // given
    const mockOrderEntity = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
    };
    const mockOrder = {
      id: mockOrderEntity.id,
      status: mockOrderEntity.status,
      isCancelable: jest.fn().mockReturnValue(true),
      cancel: jest.fn().mockImplementation(() => {
        mockOrder.status = OrderStatus.CANCELLED;
      }),
    };
    jest.spyOn(Order, 'fromEntity').mockReturnValue(mockOrder as any);

    const mockOrderItems = [
      { id: 1, productId: 1, quantity: 2 },
      { id: 2, productId: 2, quantity: 3 },
    ];
    jest
      .spyOn(OrderItem, 'fromEntity')
      .mockImplementation((entity) => entity as any);

    const mockProducts = [
      { id: 1, stock: 10, increaseStock: jest.fn() },
      { id: 2, stock: 20, increaseStock: jest.fn() },
    ];
    jest
      .spyOn(Product, 'fromEntity')
      .mockImplementation((entity) => entity as any);

    mockOrderRepository.findById.mockResolvedValue(mockOrderEntity);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockProductRepository.findByIdWithLock.mockImplementation((id) =>
      Promise.resolve(mockProducts.find((p) => p.id === id)),
    );

    // when
    await cancelOrderUseCase.execute(1);

    // then
    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(mockOrderRepository.findById).toHaveBeenCalledWith(
      1,
      'mockEntityManager',
    );
    expect(Order.fromEntity).toHaveBeenCalledWith(mockOrderEntity);
    expect(mockOrder.isCancelable).toHaveBeenCalled();
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
    expect(mockProductRepository.findByIdWithLock).toHaveBeenCalledTimes(2);
    expect(mockProducts[0].increaseStock).toHaveBeenCalledWith(2);
    expect(mockProducts[1].increaseStock).toHaveBeenCalledWith(3);
    expect(mockProductRepository.updateStock).toHaveBeenCalledTimes(2);
  });

  it('주문이 존재하지 않을 경우 예외가 발생하는지 테스트', async () => {
    // given
    mockOrderRepository.findById.mockResolvedValue(null);

    // when & then
    await expect(cancelOrderUseCase.execute(999)).rejects.toThrow(
      '주문을 찾을 수 없습니다.',
    );
  });

  it('주문이 취소 불가능한 상태일 경우 취소되지 않는지 테스트', async () => {
    // given
    const mockOrderEntity = {
      id: 1,
      status: OrderStatus.SHIPPED,
    };
    const mockOrder = {
      id: 1,
      status: OrderStatus.SHIPPED,
      isCancelable: jest.fn().mockReturnValue(false),
    };
    jest.spyOn(Order, 'fromEntity').mockReturnValue(mockOrder as any);

    mockOrderRepository.findById.mockResolvedValue(mockOrderEntity);

    // when
    await cancelOrderUseCase.execute(1);

    // then
    expect(mockOrderRepository.findById).toHaveBeenCalledWith(
      1,
      'mockEntityManager',
    );
    expect(mockOrder.isCancelable).toHaveBeenCalled();
    expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
  });

  it('주문 취소 시 상품 재고가 정상적으로 증가하는지 테스트', async () => {
    // given
    const mockOrderEntity = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
    };
    const mockOrder = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
      isCancelable: jest.fn().mockReturnValue(true),
      cancel: jest.fn().mockImplementation(() => {
        mockOrder.status = OrderStatus.CANCELLED;
      }),
    };
    jest.spyOn(Order, 'fromEntity').mockReturnValue(mockOrder as any);

    const mockOrderItems = [{ id: 1, productId: 1, quantity: 2 }];
    jest
      .spyOn(OrderItem, 'fromEntity')
      .mockImplementation((entity) => entity as any);

    const mockProduct = {
      id: 1,
      stock: 10,
      increaseStock: jest.fn().mockImplementation(() => {
        mockProduct.stock += mockOrderItems[0].quantity;
      }),
    };
    jest.spyOn(Product, 'fromEntity').mockReturnValue(mockProduct as any);

    mockOrderRepository.findById.mockResolvedValue(mockOrderEntity);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockProductRepository.findByIdWithLock.mockResolvedValue(mockProduct);

    // when
    await cancelOrderUseCase.execute(1);

    // then
    expect(mockOrderRepository.findById).toHaveBeenCalledWith(
      1,
      'mockEntityManager',
    );
    expect(mockOrder.isCancelable).toHaveBeenCalled();
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
    expect(mockProductRepository.findByIdWithLock).toHaveBeenCalledWith(
      1,
      'mockEntityManager',
    );
    expect(mockProduct.increaseStock).toHaveBeenCalledWith(2);
    expect(mockProductRepository.updateStock).toHaveBeenCalledWith(
      1,
      12,
      'mockEntityManager',
    );
  });

  it('주문 취소 중 예외 발생 시 트랜잭션이 롤백되는지 테스트', async () => {
    // given
    const mockOrderEntity = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
    };
    const mockOrder = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
      isCancelable: jest.fn().mockReturnValue(true),
      cancel: jest.fn().mockImplementation(() => {
        throw new Error('취소 중 오류 발생');
      }),
    };
    jest.spyOn(Order, 'fromEntity').mockReturnValue(mockOrder as any);

    mockOrderRepository.findById.mockResolvedValue(mockOrderEntity);

    // when & then
    await expect(cancelOrderUseCase.execute(1)).rejects.toThrow(
      '취소 중 오류 발생',
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(mockOrderRepository.findById).toHaveBeenCalledWith(
      1,
      'mockEntityManager',
    );
    expect(mockOrder.isCancelable).toHaveBeenCalled();
    expect(mockOrder.cancel).toHaveBeenCalled();
    expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
    expect(mockProductRepository.findByIdWithLock).not.toHaveBeenCalled();
  });
});
