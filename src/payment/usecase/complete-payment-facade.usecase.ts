import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
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
  IAccumulatePopularProductsSoldUseCase,
  IAccumulatePopularProductsSoldUseCaseToken,
} from 'src/product/domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { AccumulatePopularProductsSoldDto } from 'src/product/presentation/dto/request/accumulate-popular-products-sold.dto';
import {
  ISpendUserBalanceUsecase,
  ISpendUserBalanceUsecaseToken,
} from 'src/user/domain/interface/usecase/spend-user-balance.usecase.interface';
import { SpendBalanceDto } from 'src/user/presentation/dto/request/spend-balance.dto';
import { DataSource, EntityManager } from 'typeorm';
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
    @Inject(IAccumulatePopularProductsSoldUseCaseToken)
    private readonly accumulatePopularProductsSoldUseCase: IAccumulatePopularProductsSoldUseCase,
    @Inject(ICompletePaymentUseCaseToken)
    private readonly completePaymentUseCase: ICompletePaymentUseCase,
    @Inject(ISpendUserBalanceUsecaseToken)
    private readonly spendUserBalanceUsecase: ISpendUserBalanceUsecase,
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * 주문 이후 생성된 주문서와 결제 초기데이터를 바탕으로 실제 결제를 완료하는 facade usecase
   * 결제가 성공할 경우 주문서의 상태와 결제 상태를 결제완료로 변경하고, 주문서에 포함된 상품들의 판매량을 누적합니다.
   * 결제가 실패할 경우 주문서의 상태를 취소로 변경하고, 결제 상태를 실패로 변경합니다.
   * @returns
   */
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

          const orderItemEntities =
            await this.orderItemRepository.findByOrderId(
              orderEntity.id,
              entityManager,
            );

          await this.accumulatePopularProductsSoldUseCase.execute(
            new AccumulatePopularProductsSoldDto(
              orderItemEntities.map(
                (orderItem: OrderItemEntity) =>
                  new OrderItemDto(
                    orderItem.id,
                    orderItem.orderId,
                    orderItem.productOptionId,
                    orderItem.quantity,
                    orderItem.totalPriceAtOrder,
                  ),
              ),
            ),
            entityManager,
          );

          await this.spendUserBalanceUsecase.execute(
            new SpendBalanceDto(paymentEntity.userId, paymentEntity.amount),
            entityManager,
          );

          return await this.completePaymentUseCase.execute(
            new CompletePaymentDto(dto.paymentId, dto.mid, dto.tid),
            entityManager,
          );
        },
      );

      return result;
    } catch (error) {
      if (paymentEntity && 'fail' in paymentEntity) {
        (paymentEntity as PaymentEntity).fail();
        await this.paymentRepository.update(paymentEntity as PaymentEntity);
      }
      if (orderEntity && 'fail' in orderEntity) {
        (orderEntity as OrderEntity).fail();
        await this.orderRepository.updateStatus(
          (orderEntity as OrderEntity).id,
          OrderStatus.CANCELLED,
        );
      }
      this.loggerService.warn(
        `결제 실패 : UserID=${dto.userId} PaymentID=${dto.paymentId} Error=${error.message}`,
      );

      throw error;
    }
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
