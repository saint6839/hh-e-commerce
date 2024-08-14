import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  IOutboxRepository,
  IOutboxRepositoryToken,
} from 'src/common/outbox/domain/interface/outbox.repository.interface';
import { OutboxEntity } from 'src/common/outbox/repository/entity/outbox.entity';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import {
  IOrderItemRepository,
  IOrderItemRepositoryToken,
} from 'src/order/domain/interface/repository/order-item.repository.interface';
import {
  IOrderRepository,
  IOrderRepositoryToken,
} from 'src/order/domain/interface/repository/order.repository.interface';
import { OrderItemDto } from 'src/order/presentation/dto/response/order-item.dto';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import {
  NOT_FOUND_ORDER_ERROR,
  OrderEntity,
} from 'src/order/repository/entity/order.entity';
import {
  ISpendUserBalanceUsecase,
  ISpendUserBalanceUsecaseToken,
} from 'src/user/domain/interface/usecase/spend-user-balance.usecase.interface';
import { SpendBalanceDto } from 'src/user/presentation/dto/request/spend-balance.dto';
import { DataSource, EntityManager } from 'typeorm';
import { PaymentStatus } from '../domain/enum/payment-status.enum';
import {
  IPaymentRepository,
  IPaymentRepositoryToken,
} from '../domain/interface/repository/payment.repository.interface';
import { ICompletePaymentFacadeUseCase } from '../domain/interface/usecase/complete-payment-facade.usecase.interface';
import {
  ICompletePaymentUseCase,
  ICompletePaymentUseCaseToken,
} from '../domain/interface/usecase/complete-payment.usecase.interface';
import {
  NOT_FOUND_PAYMENT_ERROR,
  PaymentEntity,
} from '../infrastructure/entity/payment.entity';
import { CompletePaymentFacadeDto } from '../presentation/dto/request/complete-payment-facade.dto';
import { CompletePaymentDto } from '../presentation/dto/request/complete-payment.dto';
import { PaymentResultDto } from '../presentation/dto/response/payment-result.dto';

@Injectable()
export class CompletePaymentFacadeUseCase
  implements ICompletePaymentFacadeUseCase
{
  constructor(
    @Inject(IPaymentRepositoryToken)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(IOrderRepositoryToken)
    private readonly orderRepository: IOrderRepository,
    @Inject(IOrderItemRepositoryToken)
    private readonly orderItemRepository: IOrderItemRepository,
    @Inject(IOutboxRepositoryToken)
    private readonly outboxRepository: IOutboxRepository,
    @Inject(ICompletePaymentUseCaseToken)
    private readonly completePaymentUseCase: ICompletePaymentUseCase,
    @Inject(ISpendUserBalanceUsecaseToken)
    private readonly spendUserBalanceUsecase: ISpendUserBalanceUsecase,
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async execute(dto: CompletePaymentFacadeDto): Promise<PaymentResultDto> {
    let paymentEntity: PaymentEntity | null = null;
    let orderEntity: OrderEntity | null = null;

    try {
      const result = await this.dataSource.transaction(
        async (entityManager) => {
          paymentEntity = await this.getPaymentEntity(
            dto.paymentId,
            entityManager,
          );
          orderEntity = await this.getOrderEntity(
            paymentEntity.orderId,
            entityManager,
          );

          await this.spendUserBalanceUsecase.execute(
            new SpendBalanceDto(dto.userId, paymentEntity.amount),
          );

          const paymentResult = await this.completePaymentUseCase.execute(
            new CompletePaymentDto(dto.paymentId, dto.mid, dto.tid),
            entityManager,
          );

          if (paymentResult.status === PaymentStatus.COMPLETED) {
            // 외부 플랫폼에 결제 정보 저장하는 이벤트 발행
            this.kafkaClient.emit('payment.completed', {
              paymentId: paymentResult.paymentId,
              orderId: orderEntity.id,
              userId: paymentResult.userId,
              amount: paymentResult.amount,
              status: paymentResult.status,
            });
            await this.savePaymentCompletedOutbox(paymentResult, orderEntity);

            const orderItemEntities =
              await this.orderItemRepository.findByOrderId(
                orderEntity.id,
                entityManager,
              );

            // 인기 상품 판매량 누적 이벤트 발행
            this.kafkaClient.emit('product.popular.accumulate', {
              orderItems: orderItemEntities.map(
                (orderItem: OrderItemEntity) =>
                  new OrderItemDto(
                    orderItem.id,
                    orderItem.orderId,
                    orderItem.productOptionId,
                    orderItem.quantity,
                    orderItem.totalPriceAtOrder,
                  ),
              ),
            });
            await this.saveProductPopularAccumulateOutbox(
              orderEntity,
              orderItemEntities,
            );
          }

          return paymentResult;
        },
      );

      return result;
    } catch (error) {
      await this.handleFailure(paymentEntity, orderEntity, dto, error);
      throw error;
    }
  }

  private async savePaymentCompletedOutbox(
    paymentResult: PaymentResultDto,
    orderEntity: OrderEntity,
  ) {
    await this.outboxRepository.save({
      aggregateType: 'Payment',
      aggregateId: paymentResult.paymentId.toString(),
      eventType: 'payment.completed',
      payload: JSON.stringify({
        paymentId: paymentResult.paymentId,
        orderId: orderEntity.id,
        userId: paymentResult.userId,
        amount: paymentResult.amount,
        status: paymentResult.status,
      }),
    } as OutboxEntity);
  }

  private async saveProductPopularAccumulateOutbox(
    orderEntity: OrderEntity,
    orderItemEntities: OrderItemEntity[],
  ) {
    await this.outboxRepository.save({
      aggregateType: 'Product',
      aggregateId: orderEntity.id.toString(),
      eventType: 'product.popular.accumulate',
      payload: JSON.stringify({
        orderItems: orderItemEntities.map(
          (orderItem: OrderItemEntity) =>
            new OrderItemDto(
              orderItem.id,
              orderItem.orderId,
              orderItem.productOptionId,
              orderItem.quantity,
              orderItem.totalPriceAtOrder,
            ),
        ),
      }),
    } as OutboxEntity);
  }

  private async handleFailure(
    paymentEntity: PaymentEntity | null,
    orderEntity: OrderEntity | null,
    dto: CompletePaymentFacadeDto,
    error: any,
  ) {
    if (paymentEntity) {
      paymentEntity.fail();
      await this.paymentRepository.update(paymentEntity);
    }
    if (orderEntity) {
      await this.orderRepository.updateStatus(
        orderEntity.id,
        OrderStatus.CANCELLED,
      );
    }
    this.loggerService.warn(
      `결제 실패 : UserID=${dto.userId} PaymentID=${dto.paymentId} Error=${error.message}`,
    );
  }

  private async getPaymentEntity(
    paymentId: number,
    entityManager: EntityManager,
  ): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentRepository.findById(
      paymentId,
      entityManager,
    );
    if (!paymentEntity) {
      throw new Error(NOT_FOUND_PAYMENT_ERROR + ': ' + paymentId);
    }
    return paymentEntity;
  }

  private async getOrderEntity(
    orderId: number,
    entityManager: EntityManager,
  ): Promise<OrderEntity> {
    const orderEntity = await this.orderRepository.findById(
      orderId,
      entityManager,
    );
    if (!orderEntity) {
      throw new Error(NOT_FOUND_ORDER_ERROR + ': ' + orderId);
    }
    return orderEntity;
  }
}
