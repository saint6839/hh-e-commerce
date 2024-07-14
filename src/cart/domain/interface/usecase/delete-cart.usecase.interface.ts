import { IUseCase } from 'src/common/interface/usecase/usecase.interface';

export const IDeleteCartUsecaseToken = Symbol('IDeleteCartUsecase');

export interface IDeleteCartUsecase extends IUseCase<number, void> {}
