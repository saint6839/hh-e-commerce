import { CartDto } from 'src/cart/presentation/dto/response/cart.dto';
import { IUseCase } from 'src/common/interface/usecase/usecase.interface';

export const IBrowseCartUseCaseToken = Symbol('IBrowseCartUseCase');

export interface IBrowseCartUseCase extends IUseCase<number, CartDto[]> {}
