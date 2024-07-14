import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethod } from 'src/payment/domain/enum/payment-method.enum';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { ICreatePaymentUseCaseToken } from 'src/payment/domain/interface/usecase/create-payment.usecase.interface';
import { PaymentEntity } from 'src/payment/infrastructure/entity/payment.entity';
import { PaymentDto } from 'src/payment/presentation/dto/request/payment.dto';
import { CreatePaymentUseCase } from 'src/payment/usecase/create-payment.usecase';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('CreatePaymentUseCase 통합 테스트', () => {
  let app: INestApplication;
  let createPaymentUseCase: CreatePaymentUseCase;
  let paymentRepository: Repository<PaymentEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    createPaymentUseCase = moduleFixture.get<CreatePaymentUseCase>(
      ICreatePaymentUseCaseToken,
    );
    paymentRepository = moduleFixture.get(getRepositoryToken(PaymentEntity));
  });

  afterEach(async () => {
    await paymentRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });
  it('결제가 성공적으로 생성되고 저장되는지 테스트', async () => {
    const paymentDto = new PaymentDto(1, 1, 1000, PaymentMethod.CARD);

    const result = await createPaymentUseCase.execute(paymentDto);

    expect(result).toBeDefined();
    expect(result.userId).toBe(1);
    expect(result.orderId).toBe(1);
    expect(result.amount).toBe(1000);
    expect(result.status).toBe(PaymentStatus.PENDING);

    const savedPayment = await paymentRepository.findOne({
      where: { id: result.paymentId },
    });
    expect(savedPayment).toBeDefined();
    expect(savedPayment?.userId).toBe(1);
    expect(savedPayment?.orderId).toBe(1);
    expect(savedPayment?.amount).toBe(1000);
    expect(savedPayment?.status).toBe(PaymentStatus.PENDING);
  });

  it('잘못된 입력으로 결제 생성 시 예외가 발생하는지 테스트', async () => {
    const invalidPaymentDto = new PaymentDto(0, 0, -1000, PaymentMethod.CARD);

    await expect(
      createPaymentUseCase.execute(invalidPaymentDto),
    ).rejects.toThrow();
  });
});
