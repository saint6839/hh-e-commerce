import { Inject, Injectable } from '@nestjs/common';
import {
  IDecreaseProductStockUsecase,
  IDecreaseProductStockUsecaseToken,
} from 'src/product/domain/interface/usecase/decrease-product-stock.usecase.interface';
import { DecreaseProductStockDto } from 'src/product/presentation/dto/request/decrease-product-stock.dto';
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
  ) {}

  async execute(dto: CreateOrderFacadeDto): Promise<OrderDto> {
    await Promise.all(
      dto.productOptions.map(async (product) => {
        return await this.decreaseProductStockUseCase.execute(
          new DecreaseProductStockDto(
            product.productOptionId,
            product.quantity,
          ),
        );
      }),
    );

    return await this.createOrderUseCase.execute(dto);
  }
}
