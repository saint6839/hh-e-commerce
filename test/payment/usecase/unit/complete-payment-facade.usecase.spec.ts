import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from 'src/common/logger/logger.service';
import { IOutboxRepositoryToken } from 'src/common/outbox/domain/interface/outbox.repository.interface';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { IOrderItemRepositoryToken } from 'src/order/domain/interface/repository/order-item.repository.interface';
import { IOrderRepositoryToken } from 'src/order/domain/interface/repository/order.repository.interface';
import { NOT_FOUND_ORDER_ERROR } from 'src/order/repository/entity/order.entity';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { IPaymentRepositoryToken } from 'src/payment/domain/interface/repository/payment.repository.interface';
import { ICompletePaymentUseCaseToken } from 'src/payment/domain/interface/usecase/complete-payment.usecase.interface';
import { NOT_FOUND_PAYMENT_ERROR } from 'src/payment/infrastructure/entity/payment.entity';
import { CompletePaymentFacadeDto } from 'src/payment/presentation/dto/request/complete-payment-facade.dto';
import { CompletePaymentFacadeUseCase } from 'src/payment/usecase/complete-payment-facade.usecase';
import { ISpendUserBalanceUsecaseToken } from 'src/user/domain/interface/usecase/spend-user-balance.usecase.interface';
import { DataSource } from 'typeorm';

describe('CompletePaymentFacadeUseCase Unit Test', () => {
  let completePaymentFacadeUseCase: CompletePaymentFacadeUseCase;
  let mockPaymentRepository: any;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockOutboxRepository: any;
  let mockCompletePaymentUseCase: any;
  let mockSpendUserBalanceUsecase: any;
  let mockDataSource: any;
  let mockLoggerService: any;
  let mockKafkaClient: any;

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
    mockOutboxRepository = {
      save: jest.fn(),
    };
    mockCompletePaymentUseCase = {
      execute: jest.fn(),
    };
    mockSpendUserBalanceUsecase = {
      execute: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
    };
    mockLoggerService = {
      log: jest.fn(),
      warn: jest.fn(),
    };
    mockKafkaClient = {
      emit: jest.fn(),
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
        { provide: IOutboxRepositoryToken, useValue: mockOutboxRepository },
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
        { provide: 'KAFKA_CLIENT', useValue: mockKafkaClient },
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

    const result = await completePaymentFacadeUseCase.execute(dto);

    expect(result).toEqual(mockPaymentResult);
    expect(mockSpendUserBalanceUsecase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockPaymentResult.userId,
        amount: mockPaymentResult.amount,
      }),
    );
    expect(mockKafkaClient.emit).toHaveBeenCalledTimes(2);
    expect(mockKafkaClient.emit).toHaveBeenCalledWith(
      'payment.completed',
      expect.any(Object),
    );
    expect(mockKafkaClient.emit).toHaveBeenCalledWith(
      'product.popular.accumulate',
      expect.any(Object),
    );
    expect(mockOutboxRepository.save).toHaveBeenCalledTimes(2);
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
    mockCompletePaymentUseCase.execute.mockResolvedValue(mockPaymentResult);
    mockSpendUserBalanceUsecase.execute.mockResolvedValue({
      id: 1,
      balance: 9000,
    });

    const result = await completePaymentFacadeUseCase.execute(dto);

    expect(result).toEqual(mockPaymentResult);
    expect(mockSpendUserBalanceUsecase.execute).toHaveBeenCalled();
    expect(mockKafkaClient.emit).not.toHaveBeenCalled();
    expect(mockOutboxRepository.save).not.toHaveBeenCalled();
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
    expect(mockKafkaClient.emit).not.toHaveBeenCalled();
    expect(mockOutboxRepository.save).not.toHaveBeenCalled();
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
