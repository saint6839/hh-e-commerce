import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { LoggerService } from 'src/common/logger/logger.service';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import {
  IOrderRepository,
  IOrderRepositoryToken,
} from 'src/order/domain/interface/repository/order.repository.interface';
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
import { PaymentCompletedEvent } from '../event/payment-completed.event';
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
    @Inject(ICompletePaymentUseCaseToken)
    private readonly completePaymentUseCase: ICompletePaymentUseCase,
    @Inject(ISpendUserBalanceUsecaseToken)
    private readonly spendUserBalanceUsecase: ISpendUserBalanceUsecase,
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
    private readonly eventBus: EventBus,
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
            this.eventBus.publish(
              new PaymentCompletedEvent(
                paymentResult.paymentId,
                orderEntity.id,
                paymentResult.userId,
                paymentResult.amount,
                paymentResult.status,
              ),
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
