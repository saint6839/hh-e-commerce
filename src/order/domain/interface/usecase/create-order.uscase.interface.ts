import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { CreateOrderFacadeDto } from 'src/order/presentation/dto/request/create-order-facade.dto';

export const ICreateOrderUseCaseToken = Symbol('ICreateOrderUseCase');

export interface ICreateOrderUseCase
  extends IUseCase<CreateOrderFacadeDto, any> {}
