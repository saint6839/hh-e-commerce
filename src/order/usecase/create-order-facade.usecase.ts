import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  ICreatePaymentUseCase,
  ICreatePaymentUseCaseToken,
} from 'src/payment/domain/interface/usecase/create-payment.usecase.interface';
import { PaymentDto } from 'src/payment/presentation/dto/request/payment.dto';
import {
  IDecreaseProductStockUsecase,
  IDecreaseProductStockUsecaseToken,
} from 'src/product/domain/interface/usecase/decrease-product-stock.usecase.interface';
import { DecreaseProductStockDto } from 'src/product/presentation/dto/request/decrease-product-stock.dto';
import { DataSource } from 'typeorm';
import { ICreateOrderFacadeUseCase } from '../domain/interface/usecase/create-order-facade.usecase.interface';
import { ICreateOrderUseCaseToken } from '../domain/interface/usecase/create-order.uscase.interface';
import { CreateOrderFacadeDto } from '../presentation/dto/request/create-order-facade.dto';
import { OrderDto } from '../presentation/dto/response/order-result.dto';

@Injectable()
export class CreateOrderFacadeUseCase implements ICreateOrderFacadeUseCase {
  constructor(
    @Inject(IDecreaseProductStockUsecaseToken)
    private readonly decreaseProductStockUseCase: IDecreaseProductStockUsecase,
    @Inject(ICreateOrderUseCaseToken)
    private readonly createOrderUseCase: ICreateOrderFacadeUseCase,
    @Inject(ICreatePaymentUseCaseToken)
    private readonly createPaymentUseCase: ICreatePaymentUseCase,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource,
    private loggerService: LoggerService,
  ) {}

  /**
   * 주문시 상품 재고를 감소시키고 주문서와 결제 초기데이터를 생성하는 usecase
   * 주문이 일어날 경우 먼저 가재고 방식으로 상품 재고를 감소시킨 후 주문서와 결제 초기데이터를 생성합니다.
   * 만약, 일정 시간 동안 결제가 일어나지 않았을 경우 재고를 다시 증가시킵니다.(EventEmitter로 구현)
   * @returns
   */
  async execute(dto: CreateOrderFacadeDto): Promise<OrderDto> {
    return this.dataSource.transaction(async (entityManager) => {
      await Promise.all(
        dto.productOptions.map(async (product) => {
          return await this.decreaseProductStockUseCase.execute(
            new DecreaseProductStockDto(
              product.productOptionId,
              product.quantity,
            ),
            entityManager,
          );
        }),
      );

      const orderDto = await this.createOrderUseCase.execute(
        dto,
        entityManager,
      );

      await this.createPaymentUseCase.execute(
        new PaymentDto(dto.userId, orderDto.id, orderDto.totalPrice),
      );
      this.eventEmitter.emit('order.created', { orderId: orderDto.id });
      this.loggerService.log(
        `주문 생성 완료 : OrderID=${orderDto.id}, UserID=${dto.userId}`,
      );
      return orderDto;
    });
  }
}
