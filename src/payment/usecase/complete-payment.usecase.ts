import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  IOrderRepository,
  IOrderRepositoryToken,
} from 'src/order/domain/interface/repository/order.repository.interface';
import {
  NOT_FOUND_ORDER_ERROR,
  OrderEntity,
} from 'src/order/repository/entity/order.entity';
import { DataSource, EntityManager } from 'typeorm';
import {
  IPaymentRepository,
  IPaymentRepositoryToken,
} from '../domain/interface/repository/payment.repository.interface';
import {
  IPaymentGatewayService,
  IPaymentGatewayServiceToken,
} from '../domain/interface/service/payment-gateway.service.interface';
import { ICompletePaymentUseCase } from '../domain/interface/usecase/complete-payment.usecase.interface';
import {
  NOT_FOUND_PAYMENT_ERROR,
  PaymentEntity,
} from '../infrastructure/entity/payment.entity';
import { CompletePaymentDto } from '../presentation/dto/request/complete-payment.dto';
import { PaymentResultDto } from '../presentation/dto/response/payment-result.dto';

@Injectable()
export class CompletePaymentUseCase implements ICompletePaymentUseCase {
  constructor(
    @Inject(IPaymentRepositoryToken)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(IOrderRepositoryToken)
    private readonly orderRepository: IOrderRepository,
    @Inject(IPaymentGatewayServiceToken)
    private readonly paymentGatewayService: IPaymentGatewayService,
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * 외부 결제 mockAPI 서버로 요청을 보내 받아온 정보로 결제의 유효성 여부를 검사하고 주문서와 결제 상태를 업데이트하는 usecase
   * @returns
   */
  async execute(
    dto: CompletePaymentDto,
    entityManager?: EntityManager,
  ): Promise<PaymentResultDto> {
    const transactionCallback = async (entityManager: EntityManager) => {
      const paymentEntity = await this.getPaymentEntity(dto, entityManager);

      const orderEntity = await this.getOrderEntity(
        paymentEntity,
        entityManager,
      );

      const updatedPaymentEntity = await this.updatePaymentAndOrderStatus(
        dto,
        paymentEntity,
        orderEntity,
        entityManager,
      );

      this.loggerService.log(
        `결제 완료: PaymentID=${updatedPaymentEntity.id}, UserID=${updatedPaymentEntity.userId}, OrderID=${updatedPaymentEntity.orderId}, Amount=${updatedPaymentEntity.amount}, Status=${updatedPaymentEntity.status}`,
      );

      return new PaymentResultDto(
        updatedPaymentEntity.id,
        updatedPaymentEntity.userId,
        updatedPaymentEntity.orderId,
        updatedPaymentEntity.amount,
        updatedPaymentEntity.status,
        updatedPaymentEntity.paymentMethod,
        updatedPaymentEntity.paidAt,
      );
    };

    if (entityManager) {
      return transactionCallback(entityManager);
    }
    return this.dataSource.transaction(transactionCallback);
  }

  private async getOrderEntity(
    paymentEntity: PaymentEntity,
    entityManager: EntityManager,
  ) {
    const orderEntity = await this.orderRepository.findById(
      paymentEntity.orderId,
      entityManager,
    );

    if (!orderEntity) {
      throw new Error(NOT_FOUND_ORDER_ERROR);
    }
    return orderEntity;
  }

  private async getPaymentEntity(
    dto: CompletePaymentDto,
    entityManager: EntityManager,
  ) {
    const paymentEntity = await this.paymentRepository.findById(
      dto.paymentId,
      entityManager,
    );

    if (!paymentEntity) {
      throw new Error(NOT_FOUND_PAYMENT_ERROR);
    }
    return paymentEntity;
  }

  private async updatePaymentAndOrderStatus(
    dto: CompletePaymentDto,
    paymentEntity: PaymentEntity,
    orderEntity: OrderEntity,
    entityManager: EntityManager,
  ): Promise<PaymentEntity> {
    const isValid = await this.isValidTransactionResult(dto, paymentEntity);

    if (isValid) {
      paymentEntity.complete();
      orderEntity.complete();
    } else {
      paymentEntity.fail();
    }

    const updatedPaymentEntity = await this.paymentRepository.update(
      paymentEntity,
      entityManager,
    );
    await this.orderRepository.updateStatus(
      orderEntity.id,
      orderEntity.status,
      entityManager,
    );

    return updatedPaymentEntity;
  }

  /**
   * 외부 결제 서버가 없는 상태이기 때문에, 가상의 결제 검증이 통과한 상황을 가정합니다.
   * @param dto
   * @param entity
   * @returns true
   */
  private async isValidTransactionResult(
    dto: CompletePaymentDto,
    entity: PaymentEntity,
  ): Promise<boolean> {
    try {
      // 가상의 PG사로 실결제 데이터 조회
      const paidInfo = await this.paymentGatewayService.getPaidInfo(
        dto.mid,
        dto.tid,
      );

      //  실제 로직
      //  return entity.isAmountEqualTo(paidInfo.amount);

      // mocking 로직
      return true;
    } catch (error) {
      console.error('Error validating transaction result:', error);
      throw new Error('결제 검증 중 오류가 발생했습니다.');
    }
  }
}
