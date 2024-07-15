import { Test, TestingModule } from '@nestjs/testing';
import { IOrderItemRepositoryToken } from 'src/order/domain/interface/repository/order-item.repository.interface';
import { IOrderRepositoryToken } from 'src/order/domain/interface/repository/order.repository.interface';
import { NOT_FOUND_ORDER_ERROR } from 'src/order/repository/entity/order.entity';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { IPaymentRepositoryToken } from 'src/payment/domain/interface/repository/payment.repository.interface';
import { ICompletePaymentUseCaseToken } from 'src/payment/domain/interface/usecase/complete-payment.usecase.interface';
import { NOT_FOUND_PAYMENT_ERROR } from 'src/payment/infrastructure/entity/payment.entity';
import { CompletePaymentFacadeDto } from 'src/payment/presentation/dto/request/complete-payment-facade.dto';
import { CompletePaymentFacadeUseCase } from 'src/payment/usecase/complete-payment-facade.usecase';
import { IAccumulatePopularProductsSoldUseCaseToken } from 'src/product/domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { ISpendUserBalanceUsecaseToken } from 'src/user/domain/interface/usecase/spend-user-balance.usecase.interface';
import { DataSource } from 'typeorm';

describe('CompletePaymentFacadeUseCase Unit Test', () => {
  let completePaymentFacadeUseCase: CompletePaymentFacadeUseCase;
  let mockPaymentRepository: any;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockAccumulatePopularProductsSoldUseCase: any;
  let mockCompletePaymentUseCase: any;
  let mockSpendUserBalanceUsecase: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockPaymentRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockOrderRepository = {
      findById: jest.fn(),
    };
    mockOrderItemRepository = {
      findByOrderId: jest.fn(),
    };
    mockAccumulatePopularProductsSoldUseCase = {
      execute: jest.fn(),
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
          provide: IAccumulatePopularProductsSoldUseCaseToken,
          useValue: mockAccumulatePopularProductsSoldUseCase,
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
      ],
    }).compile();

    completePaymentFacadeUseCase = module.get<CompletePaymentFacadeUseCase>(
      CompletePaymentFacadeUseCase,
    );
  });

  it('결제가 성공적으로 완료되는 경우 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = {
      id: 1,
      orderId: 1,
      userId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
      fail: jest.fn(function () {
        this.status = PaymentStatus.FAILED;
      }),
    };
    const mockOrder = { id: 1 };
    const mockOrderItems = [
      {
        id: 1,
        orderId: 1,
        productOptionId: 1,
        quantity: 2,
        totalPriceAtOrder: 2000,
      },
    ];

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockCompletePaymentUseCase.execute.mockResolvedValue({
      status: PaymentStatus.COMPLETED,
    });

    const result = await completePaymentFacadeUseCase.execute(dto);

    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(mockAccumulatePopularProductsSoldUseCase.execute).toHaveBeenCalled();
    expect(mockCompletePaymentUseCase.execute).toHaveBeenCalled();
    expect(mockSpendUserBalanceUsecase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, amount: 1000 }),
      expect.any(Object),
    );
  });

  it('결제가 실패하는 경우 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = { id: 1, orderId: 1, userId: 1, amount: 1000 };
    const mockOrder = { id: 1 };
    const mockOrderItems = [
      {
        id: 1,
        orderId: 1,
        productOptionId: 1,
        quantity: 2,
        totalPriceAtOrder: 2000,
      },
    ];

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockCompletePaymentUseCase.execute.mockResolvedValue({
      status: PaymentStatus.FAILED,
    });

    const result = await completePaymentFacadeUseCase.execute(dto);

    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(mockAccumulatePopularProductsSoldUseCase.execute).toHaveBeenCalled();
    expect(mockCompletePaymentUseCase.execute).toHaveBeenCalled();
  });

  it('결제가 존재하지 않는 경우 예외 발생 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(999, 1, 'test_mid', 'test_tid');

    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(completePaymentFacadeUseCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PAYMENT_ERROR,
    );
  });

  it('주문이 존재하지 않는 경우 예외 발생 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = {
      id: 1,
      orderId: 999,
      userId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
      fail: jest.fn(function () {
        this.status = PaymentStatus.FAILED;
      }),
    };

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(completePaymentFacadeUseCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_ORDER_ERROR,
    );
  });

  it('예외 발생 시 결제 상태를 FAILED로 변경하고 예외를 다시 throw하는지 테스트', async () => {
    const dto = new CompletePaymentFacadeDto(1, 1, 'test_mid', 'test_tid');
    const mockPayment = {
      id: 1,
      orderId: 1,
      userId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
      fail: jest.fn(function () {
        this.status === PaymentStatus.FAILED;
      }),
    };
    const mockOrder = { id: 1 };
    const mockOrderItems = [
      {
        id: 1,
        orderId: 1,
        productOptionId: 1,
        quantity: 2,
        totalPriceAtOrder: 2000,
      },
    ];

    mockPaymentRepository.findById.mockResolvedValue(mockPayment);
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderItemRepository.findByOrderId.mockResolvedValue(mockOrderItems);
    mockAccumulatePopularProductsSoldUseCase.execute.mockImplementation(() => {
      throw new Error('테스트 에러');
    });

    await expect(completePaymentFacadeUseCase.execute(dto)).rejects.toThrow(
      '테스트 에러',
    );

    expect(mockPayment.fail).toHaveBeenCalled();
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
