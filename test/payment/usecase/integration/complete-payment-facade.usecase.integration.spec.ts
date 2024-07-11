import { INestApplication, Logger } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import {
  NOT_FOUND_ORDER_ERROR,
  OrderEntity,
} from 'src/order/repository/entity/order.entity';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { ICompletePaymentFacadeUseCaseToken } from 'src/payment/domain/interface/usecase/complete-payment-facade.usecase.interface';
import {
  NOT_FOUND_PAYMENT_ERROR,
  PaymentEntity,
} from 'src/payment/infrastructure/entity/payment.entity';
import { CompletePaymentFacadeDto } from 'src/payment/presentation/dto/request/complete-payment-facade.dto';
import { CompletePaymentFacadeUseCase } from 'src/payment/usecase/complete-payment-facade.usecase';
import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

const logger = new Logger('TestLogger');
logger.debug = console.log;
logger.verbose = console.log;

describe('CompletePaymentFacadeUseCase 통합 테스트', () => {
  let app: INestApplication;
  let completePaymentFacadeUseCase: CompletePaymentFacadeUseCase;
  let paymentRepository: Repository<PaymentEntity>;
  let orderRepository: Repository<OrderEntity>;
  let orderItemRepository: Repository<OrderItemEntity>;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    completePaymentFacadeUseCase =
      moduleFixture.get<CompletePaymentFacadeUseCase>(
        ICompletePaymentFacadeUseCaseToken,
      );
    paymentRepository = moduleFixture.get(getRepositoryToken(PaymentEntity));
    orderRepository = moduleFixture.get(getRepositoryToken(OrderEntity));
    orderItemRepository = moduleFixture.get(
      getRepositoryToken(OrderItemEntity),
    );
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await paymentRepository.clear();
    await orderRepository.clear();
    await orderItemRepository.clear();
    await userRepository.clear();
  });

  it('결제가 성공적으로 완료되는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: '테스트 사용자',
      balance: 10000,
    });

    const order = await orderRepository.save({
      userId: user.id,
      totalPrice: 5000,
      status: OrderStatus.PENDING_PAYMENT,
    });

    await orderItemRepository.save({
      orderId: order.id,
      productOptionId: 1,
      productName: '테스트 상품',
      quantity: 2,
      totalPriceAtOrder: 5000,
    });

    const payment = await paymentRepository.save({
      userId: user.id,
      orderId: order.id,
      amount: 5000,
      status: PaymentStatus.PENDING,
    });

    const completePaymentFacadeDto = new CompletePaymentFacadeDto(
      payment.id,
      payment.userId,
      'test_mid',
      'test_tid',
    );

    // when
    const result = await completePaymentFacadeUseCase.execute(
      completePaymentFacadeDto,
    );

    // then
    expect(result).toBeDefined();
    expect(result.paymentId).toBe(payment.id);
    expect(result.status).toBe(PaymentStatus.COMPLETED);

    const updatedPayment = await paymentRepository.findOne({
      where: { id: payment.id },
    });
    expect(updatedPayment).toBeDefined();
    expect(updatedPayment?.status).toBe(PaymentStatus.COMPLETED);

    const updatedOrder = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(updatedOrder).toBeDefined();
    expect(updatedOrder?.status).toBe(OrderStatus.PAID);
  });

  it('존재하지 않는 결제에 대해 예외를 발생시키는지 테스트', async () => {
    // given
    const completePaymentFacadeDto = new CompletePaymentFacadeDto(
      999,
      1,
      'test_mid',
      'test_tid',
    );

    // when & then
    await expect(
      completePaymentFacadeUseCase.execute(completePaymentFacadeDto),
    ).rejects.toThrow(NOT_FOUND_PAYMENT_ERROR);
  });

  it('존재하지 않는 주문에 대해 예외를 발생시키는지 테스트', async () => {
    // given
    const payment = await paymentRepository.save({
      userId: 1,
      orderId: 999,
      amount: 1000,
      status: PaymentStatus.PENDING,
    });

    const completePaymentFacadeDto = new CompletePaymentFacadeDto(
      payment.id,
      payment.userId,
      'test_mid',
      'test_tid',
    );

    // when & then
    await expect(
      completePaymentFacadeUseCase.execute(completePaymentFacadeDto),
    ).rejects.toThrow(NOT_FOUND_ORDER_ERROR);
  });

  it('잔액이 부족한 경우 예외를 발생시키는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: '테스트 사용자',
      balance: 1000,
    });

    const order = await orderRepository.save({
      userId: user.id,
      totalPrice: 5000,
      status: OrderStatus.PENDING_PAYMENT,
    });

    await orderItemRepository.save({
      orderId: order.id,
      productOptionId: 1,
      productName: '테스트 상품',
      quantity: 2,
      totalPriceAtOrder: 5000,
    });

    const payment = await paymentRepository.save({
      userId: user.id,
      orderId: order.id,
      amount: 5000,
      status: PaymentStatus.PENDING,
    });

    const completePaymentFacadeDto = new CompletePaymentFacadeDto(
      payment.id,
      payment.userId,
      'test_mid',
      'test_tid',
    );

    // when & then
    await expect(
      completePaymentFacadeUseCase.execute(completePaymentFacadeDto),
    ).rejects.toThrow('잔액이 부족합니다');

    const unchangedPayment = await paymentRepository.findOne({
      where: { id: payment.id },
    });
    expect(unchangedPayment).toBeDefined();
    expect(unchangedPayment?.status).toBe(PaymentStatus.PENDING);

    const unchangedOrder = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(unchangedOrder).toBeDefined();
    expect(unchangedOrder?.status).toBe(OrderStatus.PENDING_PAYMENT);

    const unchangedUser = await userRepository.findOne({
      where: { id: user.id },
    });
    expect(unchangedUser).toBeDefined();
    expect(unchangedUser?.balance).toBe(1000);
  });
});
