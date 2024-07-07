import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

export const IBrowseProductsUseCaseToken = Symbol('IBrowseProductsUseCase');

export interface IBrowseProductsUseCase extends IUseCase<void, ProductDto[]> {}
