import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
  ) {}

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
      return orderDto;
    });
  }
}
