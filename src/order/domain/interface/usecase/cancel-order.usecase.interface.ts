import { IUseCase } from 'src/common/interface/usecase/usecase.interface';

export const ICancelOrderUseCaseToken = Symbol('ICancelOrderUseCase');

export interface ICancelOrderUseCase extends IUseCase<number, void> {}
