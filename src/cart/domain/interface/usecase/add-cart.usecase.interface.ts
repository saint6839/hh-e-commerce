import { AddCartProductDetailDto } from 'src/cart/presentation/dto/request/add-cart-product-detail.dto';
import { CartDto } from 'src/cart/presentation/dto/response/cart.dto';
import { IUseCase } from 'src/common/interface/usecase/usecase.interface';

export const IAddCartUseCaseToken = Symbol('IAddCartUseCase');

export interface IAddCartUseCase
  extends IUseCase<AddCartProductDetailDto, CartDto> {}
