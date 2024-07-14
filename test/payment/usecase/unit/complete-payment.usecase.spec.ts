import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { IOrderRepositoryToken } from 'src/order/domain/interface/repository/order.repository.interface';
import { NOT_FOUND_ORDER_ERROR } from 'src/order/repository/entity/order.entity';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { IPaymentRepositoryToken } from 'src/payment/domain/interface/repository/payment.repository.interface';
import { IPaymentGatewayServiceToken } from 'src/payment/domain/interface/service/payment-gateway.service.interface';
import { NOT_FOUND_PAYMENT_ERROR } from 'src/payment/infrastructure/entity/payment.entity';
import { CompletePaymentDto } from 'src/payment/presentation/dto/request/complete-payment.dto';
import { CompletePaymentUseCase } from 'src/payment/usecase/complete-payment.usecase';
import { DataSource, EntityManager } from 'typeorm';

describe('CompletePaymentUseCase', () => {
  let useCase: CompletePaymentUseCase;
  let mockPaymentRepository: any;
  let mockOrderRepository: any;
  let mockPaymentGatewayService: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockPaymentRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockOrderRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockPaymentGatewayService = {
      getPaidInfo: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompletePaymentUseCase,
        { provide: IPaymentRepositoryToken, useValue: mockPaymentRepository },
        { provide: IOrderRepositoryToken, useValue: mockOrderRepository },
        {
          provide: IPaymentGatewayServiceToken,
          useValue: mockPaymentGatewayService,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    useCase = module.get<CompletePaymentUseCase>(CompletePaymentUseCase);
  });

  it('결제가 성공적으로 완료되는지 테스트', async () => {
    const dto: CompletePaymentDto = {
      paymentId: 1,
      mid: 'test_mid',
      tid: 'test_tid',
    };

    const mockPaymentEntity = {
      id: 1,
      userId: 1,
      orderId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
      complete: jest.fn(
        () => (mockPaymentEntity.status = PaymentStatus.COMPLETED),
      ),
      fail: jest.fn(() => (mockPaymentEntity.status = PaymentStatus.FAILED)),
    };

    const mockOrderEntity = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
      complete: jest.fn(() => (mockOrderEntity.status = OrderStatus.PAID)),
    };

    mockPaymentRepository.findById.mockResolvedValue(mockPaymentEntity);
    mockOrderRepository.findById.mockResolvedValue(mockOrderEntity);
    mockPaymentGatewayService.getPaidInfo.mockResolvedValue({ amount: 1000 });
    mockPaymentRepository.update.mockResolvedValue({
      ...mockPaymentEntity,
      status: PaymentStatus.COMPLETED,
    });

    const result = await useCase.execute(dto);

    expect(result).toBeDefined();
    expect(result.paymentId).toBe(1);
    expect(result.status).toBe(PaymentStatus.COMPLETED);
    expect(mockPaymentEntity.complete).toHaveBeenCalled();
    expect(mockOrderEntity.complete).toHaveBeenCalled();
    expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
      1,
      OrderStatus.PAID,
      expect.any(Object),
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 결제에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: CompletePaymentDto = {
      paymentId: 999,
      mid: 'test_mid',
      tid: 'test_tid',
    };

    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(NOT_FOUND_PAYMENT_ERROR);
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 주문에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: CompletePaymentDto = {
      paymentId: 1,
      mid: 'test_mid',
      tid: 'test_tid',
    };

    const mockPaymentEntity = {
      id: 1,
      userId: 1,
      orderId: 999,
      amount: 1000,
      status: PaymentStatus.PENDING,
    };

    mockPaymentRepository.findById.mockResolvedValue(mockPaymentEntity);
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(NOT_FOUND_ORDER_ERROR);
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('이미 트랜잭션이 시작된 경우 새 트랜잭션을 시작하지 않는지 테스트', async () => {
    const dto: CompletePaymentDto = {
      paymentId: 1,
      mid: 'test_mid',
      tid: 'test_tid',
    };

    const mockPaymentEntity = {
      id: 1,
      userId: 1,
      orderId: 1,
      amount: 1000,
      status: PaymentStatus.PENDING,
      complete: jest.fn(),
      fail: jest.fn(() => (mockPaymentEntity.status = PaymentStatus.FAILED)),
    };

    const mockOrderEntity = {
      id: 1,
      status: OrderStatus.PENDING_PAYMENT,
      complete: jest.fn(() => (mockOrderEntity.status = OrderStatus.PAID)),
    };

    mockPaymentRepository.findById.mockResolvedValue(mockPaymentEntity);
    mockOrderRepository.findById.mockResolvedValue(mockOrderEntity);
    mockPaymentGatewayService.getPaidInfo.mockResolvedValue({ amount: 1000 });
    mockPaymentRepository.update.mockResolvedValue({
      ...mockPaymentEntity,
      status: PaymentStatus.COMPLETED,
    });

    const existingEntityManager = {} as EntityManager;
    await useCase.execute(dto, existingEntityManager);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(mockPaymentRepository.findById).toHaveBeenCalledWith(
      1,
      existingEntityManager,
    );
    expect(mockOrderRepository.findById).toHaveBeenCalledWith(
      1,
      existingEntityManager,
    );
    expect(mockPaymentRepository.update).toHaveBeenCalledWith(
      expect.anything(),
      existingEntityManager,
    );
    expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
      1,
      OrderStatus.PAID,
      existingEntityManager,
    );
  });
});
