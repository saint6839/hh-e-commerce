import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { CreateOrderDto } from 'src/order/presentation/dto/request/create-order.dto';
import { OrderDto } from 'src/order/presentation/dto/response/order-result.dto';

export const ICreateOrderUseCaseToken = Symbol('ICreateOrderUseCase');

export interface ICreateOrderUseCase
  extends IUseCase<CreateOrderDto, OrderDto> {}
