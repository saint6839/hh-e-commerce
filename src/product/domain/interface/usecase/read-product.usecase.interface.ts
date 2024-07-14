import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

export const IReadProductUseCaseToken = Symbol('IReadProductUseCase');

export interface IReadProductUseCase extends IUseCase<number, ProductDto> {}
