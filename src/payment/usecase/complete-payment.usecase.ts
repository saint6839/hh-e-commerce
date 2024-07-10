import { Inject, Injectable } from '@nestjs/common';
import {
  IOrderItemRepository,
  IOrderItemRepositoryToken,
} from 'src/order/domain/interface/repository/order-item.repository.interface';
import {
  IOrderRepository,
  IOrderRepositoryToken,
} from 'src/order/domain/interface/repository/order.repository.interface';
import {
  NOT_FOUND_ORDER_ERROR,
  OrderEntity,
} from 'src/order/repository/entity/order.entity';
import {
  IDailyPopularProductRepository,
  IDailyPopularProductRepositoryToken,
} from 'src/product/domain/interface/repository/daily-popular-product.repository.interface';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from 'src/product/domain/interface/repository/product-option.repository.interface';
import { DailyPopularProductEntity } from 'src/product/infrastructure/entity/daily-popular-product.entity';
import { NOT_FOUND_PRODUCT_ERROR } from 'src/product/infrastructure/entity/product.entity';
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
    @Inject(IOrderItemRepositoryToken)
    private readonly orderItemRepository: IOrderItemRepository,
    @Inject(IDailyPopularProductRepositoryToken)
    private readonly dailyPopularProductRepository: IDailyPopularProductRepository,
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    @Inject(IPaymentGatewayServiceToken)
    private readonly paymentGatewayService: IPaymentGatewayService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    dto: CompletePaymentDto,
    entityManager?: EntityManager,
  ): Promise<PaymentResultDto> {
    const transactionCallback = async (entityManager: EntityManager) => {
      const paymentEntity = await this.getPaymentEntity(
        dto.paymentId,
        entityManager,
      );
      const orderEntity: OrderEntity = await this.getOrderEntity(
        paymentEntity.orderId,
        entityManager,
      );

      const orderItemEntities = await this.orderItemRepository.findByOrderId(
        orderEntity.id,
        entityManager,
      );

      await this.updateDailyPopularProducts(orderItemEntities, entityManager);

      const isValid = await this.isValidTransactionResult(dto, paymentEntity);
      const updatedPaymentEntity = await this.updatePaymentAndOrderStatus(
        paymentEntity,
        orderEntity,
        isValid,
        entityManager,
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

  private async updateDailyPopularProducts(
    orderItemEntities: any[],
    entityManager: EntityManager,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const orderItem of orderItemEntities) {
      const productOptionEntity = await this.productOptionRepository.findById(
        orderItem.productOptionId,
        entityManager,
      );

      if (!productOptionEntity) {
        throw new Error(
          NOT_FOUND_PRODUCT_ERROR + ': ' + orderItem.productOptionId,
        );
      }

      const existingDailyPopularProductEntity =
        await this.dailyPopularProductRepository.findOne(
          productOptionEntity.productId,
          productOptionEntity.id,
          today,
          entityManager,
        );

      if (existingDailyPopularProductEntity) {
        existingDailyPopularProductEntity.accumulateTotalSold(
          orderItem.quantity,
        );
        await this.dailyPopularProductRepository.save(
          existingDailyPopularProductEntity,
          entityManager,
        );
      } else {
        const newDailyPopularProductEntity = DailyPopularProductEntity.of(
          productOptionEntity.productId,
          productOptionEntity.id,
          orderItem.quantity,
          today,
        );
        await this.dailyPopularProductRepository.save(
          newDailyPopularProductEntity,
          entityManager,
        );
      }
    }
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

  private async updatePaymentAndOrderStatus(
    paymentEntity: PaymentEntity,
    orderEntity: OrderEntity,
    isValid: boolean,
    entityManager: EntityManager,
  ): Promise<PaymentEntity> {
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
}
