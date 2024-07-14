import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { CreateOrderFacadeDto } from 'src/order/presentation/dto/request/create-order-facade.dto';
import { OrderDto } from 'src/order/presentation/dto/response/order-result.dto';

export const ICreateOrderFacadeUseCaseToken = Symbol(
  'ICreateOrderFacadeUseCase',
);

export interface ICreateOrderFacadeUseCase
  extends IUseCase<CreateOrderFacadeDto, OrderDto> {}
