import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethod } from 'src/payment/domain/enum/payment-method.enum';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { IPaymentRepositoryToken } from 'src/payment/domain/interface/repository/payment.repository.interface';
import { PaymentEntity } from 'src/payment/infrastructure/entity/payment.entity';
import { PaymentDto } from 'src/payment/presentation/dto/request/payment.dto';
import { PaymentResultDto } from 'src/payment/presentation/dto/response/payment-result.dto';
import { CreatePaymentUseCase } from 'src/payment/usecase/create-payment.usecase';
import { DataSource, EntityManager } from 'typeorm';

describe('CreatePaymentUseCase 단위 테스트', () => {
  let createPaymentUseCase: CreatePaymentUseCase;
  let mockPaymentRepository: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockPaymentRepository = {
      create: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentUseCase,
        {
          provide: IPaymentRepositoryToken,
          useValue: mockPaymentRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    createPaymentUseCase =
      module.get<CreatePaymentUseCase>(CreatePaymentUseCase);
  });

  it('결제가 성공적으로 생성되는지 테스트', async () => {
    const paymentDto = new PaymentDto(1, 1, 1000, PaymentMethod.CARD);
    const mockPaymentEntity = new PaymentEntity();
    mockPaymentEntity.id = 1;
    mockPaymentEntity.userId = 1;
    mockPaymentEntity.orderId = 1;
    mockPaymentEntity.amount = 1000;
    mockPaymentEntity.status = PaymentStatus.PENDING;
    mockPaymentEntity.paidAt = new Date();

    mockPaymentRepository.create.mockResolvedValue(mockPaymentEntity);

    const result = await createPaymentUseCase.execute(paymentDto);

    expect(result).toBeInstanceOf(PaymentResultDto);
    expect(result.paymentId).toBe(1);
    expect(result.userId).toBe(1);
    expect(result.orderId).toBe(1);
    expect(result.amount).toBe(1000);
    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(result.paidAt).toBeDefined();
  });

  it('트랜잭션 내에서 실행될 때 새로운 트랜잭션을 시작하지 않는지 테스트', async () => {
    const paymentDto = new PaymentDto(1, 1, 1000, PaymentMethod.CARD);
    const mockEntityManager = {} as EntityManager;

    const mockPaymentEntity = new PaymentEntity();
    mockPaymentEntity.id = 1;
    mockPaymentEntity.userId = 1;
    mockPaymentEntity.orderId = 1;
    mockPaymentEntity.amount = 1000;
    mockPaymentEntity.status = PaymentStatus.PENDING;
    mockPaymentEntity.paidAt = new Date();

    mockPaymentRepository.create.mockResolvedValue(mockPaymentEntity);

    const result = await createPaymentUseCase.execute(
      paymentDto,
      mockEntityManager,
    );

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(mockPaymentRepository.create).toHaveBeenCalledWith(
      expect.any(PaymentEntity),
      mockEntityManager,
    );
    expect(result).toBeInstanceOf(PaymentResultDto);
    expect(result.paymentId).toBe(1);
    expect(result.userId).toBe(1);
    expect(result.orderId).toBe(1);
    expect(result.amount).toBe(1000);
    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(result.paidAt).toBeDefined();
  });
});
