import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from 'src/common/logger/logger.service';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { IOrderItemRepositoryToken } from 'src/order/domain/interface/repository/order-item.repository.interface';
import { IOrderRepositoryToken } from 'src/order/domain/interface/repository/order.repository.interface';
import { NOT_FOUND_ORDER_ERROR } from 'src/order/repository/entity/order.entity';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { IPaymentRepositoryToken } from 'src/payment/domain/interface/repository/payment.repository.interface';
import { ICompletePaymentUseCaseToken } from 'src/payment/domain/interface/usecase/complete-payment.usecase.interface';
import { PaymentCompletedEvent } from 'src/payment/event/payment-completed.event';
import { NOT_FOUND_PAYMENT_ERROR } from 'src/payment/infrastructure/entity/payment.entity';
import { CompletePaymentFacadeDto } from 'src/payment/presentation/dto/request/complete-payment-facade.dto';
import { CompletePaymentFacadeUseCase } from 'src/payment/usecase/complete-payment-facade.usecase';
import { AccumulatePopularProductsSoldEvent } from 'src/product/event/accumulate-popular-products-sold.event';
import { ISpendUserBalanceUsecaseToken } from 'src/user/domain/interface/usecase/spend-user-balance.usecase.interface';
import { DataSource } from 'typeorm';

describe('CompletePaymentFacadeUseCase Unit Test', () => {
  let completePaymentFacadeUseCase: CompletePaymentFacadeUseCase;
  let mockPaymentRepository: any;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockCompletePaymentUseCase: any;
  let mockSpendUserBalanceUsecase: any;
  let mockAccumulatePopularProductsSoldUseCase: any;
  let mockDataSource: any;
  let mockLoggerService: any;
  let mockEventBus: any;

  beforeEach(async () => {
    mockPaymentRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockOrderRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockOrderItemRepository = {
      findByOrderId: jest.fn(),
    };
    mockCompletePaymentUseCase = {
      execute: jest.fn(),
    };
    mockSpendUserBalanceUsecase = {
      execute: jest.fn(),
    };
    mockAccumulatePopularProductsSoldUseCase = {
      execute: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
    };
    mockLoggerService = {
      log: jest.fn(),
      warn: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompletePaymentFacadeUseCase,
        { provide: IPaymentRepositoryToken, useValue: mockPaymentRepository },
        { provide: IOrderRepositoryToken, useValue: mockOrderRepository },
        {
          provide: IOrderItemRepositoryToken,
          useValue: mockOrderItemRepository,
        },
        {
          provide: ICompletePaymentUseCaseToken,
          useValue: mockCompletePaymentUseCase,
        },
        {
          provide: ISpendUserBalanceUsecaseToken,
          useValue: mockSpendUserBalanceUsecase,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    completePaymentFacadeUseCase = module.get<CompletePaymentFacadeUseCase>(
      CompletePaymentFacadeUseCase,
    );
  });

  it('결제가 성공적으로 완료되고 이벤트가 발행되는지 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = {
      id: 1,
      orderId: 1,
      userId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
    };
    const mockOrder = { id: 1 };
    const mockOrderItems = [
      {
        id: 1,
        orderId: 1,
        productOptionId: 1,
        quantity: 2,
        totalPriceAtOrder: 500,
      },
      {
        id: 2,
        orderId: 1,
        productOptionId: 2,
        quantity: 1,
        totalPriceAtOrder: 500,
      },
    ];
    const mockPaymentResult = {
      paymentId: 1,
      userId: 1,
      orderId: 1,
      amount: 1000,
      status: PaymentStatus.COMPLETED,
    };

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockCompletePaymentUseCase.execute.mockResolvedValue(mockPaymentResult);
    mockSpendUserBalanceUsecase.execute.mockResolvedValue({
      id: 1,
      balance: 9000,
    });
    mockAccumulatePopularProductsSoldUseCase.execute.mockResolvedValue(
      undefined,
    );

    const result = await completePaymentFacadeUseCase.execute(dto);

    expect(result).toEqual(mockPaymentResult);
    expect(mockSpendUserBalanceUsecase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockPaymentResult.userId,
        amount: mockPaymentResult.amount,
      }),
    );
    expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(PaymentCompletedEvent),
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(AccumulatePopularProductsSoldEvent),
    );
  });

  it('결제 실패 시 이벤트가 발행되지 않는지 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = {
      id: 1,
      orderId: 1,
      userId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
      fail: jest.fn(),
    };
    const mockOrder = { id: 1 };
    const mockPaymentResult = {
      paymentId: 1,
      userId: 1,
      orderId: 1,
      amount: 1000,
      status: PaymentStatus.FAILED,
    };

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue([]);
    mockCompletePaymentUseCase.execute.mockResolvedValue(mockPaymentResult);
    mockSpendUserBalanceUsecase.execute.mockResolvedValue({
      id: 1,
      balance: 9000,
    });

    const result = await completePaymentFacadeUseCase.execute(dto);

    expect(result).toEqual(mockPaymentResult);
    expect(mockSpendUserBalanceUsecase.execute).toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('잔액 차감 실패 시 예외를 throw하고 결제 상태를 FAILED로 변경하는지 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = {
      id: 1,
      orderId: 1,
      userId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
      fail: jest.fn(),
    };
    const mockOrder = { id: 1 };

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue([]);
    mockSpendUserBalanceUsecase.execute.mockRejectedValue(
      new Error('잔액 부족'),
    );

    await expect(completePaymentFacadeUseCase.execute(dto)).rejects.toThrow(
      '잔액 부족',
    );

    expect(mockPayment.fail).toHaveBeenCalled();
    expect(mockPaymentRepository.update).toHaveBeenCalledWith(mockPayment);
    expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
      1,
      OrderStatus.CANCELLED,
    );
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('결제 엔티티를 찾을 수 없을 때 예외를 throw하는지 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(999, 1, 'test_mid', 'test_tid');

    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(completePaymentFacadeUseCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PAYMENT_ERROR,
    );
  });

  it('주문 엔티티를 찾을 수 없을 때 예외를 throw하는지 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = {
      id: 1,
      orderId: 999,
      userId: 1,
      amount: 1000,
      fail: jest.fn(),
    };

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(completePaymentFacadeUseCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_ORDER_ERROR,
    );
  });
});
