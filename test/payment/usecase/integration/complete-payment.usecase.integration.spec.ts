import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { OrderEntity } from 'src/order/repository/entity/order.entity';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { ICompletePaymentUseCaseToken } from 'src/payment/domain/interface/usecase/complete-payment.usecase.interface';
import { PaymentEntity } from 'src/payment/infrastructure/entity/payment.entity';
import { CompletePaymentDto } from 'src/payment/presentation/dto/request/complete-payment.dto';
import { CompletePaymentUseCase } from 'src/payment/usecase/complete-payment.usecase';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('CompletePaymentUseCase Integration Test', () => {
  let app: INestApplication;
  let completePaymentUseCase: CompletePaymentUseCase;
  let paymentRepository: Repository<PaymentEntity>;
  let orderRepository: Repository<OrderEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    completePaymentUseCase = moduleFixture.get<CompletePaymentUseCase>(
      ICompletePaymentUseCaseToken,
    );
    paymentRepository = moduleFixture.get(getRepositoryToken(PaymentEntity));
    orderRepository = moduleFixture.get(getRepositoryToken(OrderEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await paymentRepository.clear();
    await orderRepository.clear();
  });

  it('결제가 성공적으로 완료되는지 테스트', async () => {
    // given
    const order = await orderRepository.save({
      userId: 1,
      totalPrice: 1000,
      status: OrderStatus.PENDING_PAYMENT,
    });

    const payment = await paymentRepository.save({
      userId: 1,
      orderId: order.id,
      amount: 1000,
      status: PaymentStatus.PENDING,
    });

    const completePaymentDto = new CompletePaymentDto(
      payment.id,
      payment.userId,
      'test_mid',
      'test_tid',
    );

    // when
    const result = await completePaymentUseCase.execute(completePaymentDto);

    // then
    expect(result).toBeDefined();
    expect(result.paymentId).toBe(payment.id);
    expect(result.status).toBe(PaymentStatus.COMPLETED);

    const updatedOrder = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(updatedOrder).toBeDefined();
    expect(updatedOrder?.status).toBe(OrderStatus.PAID);
  });
});
