import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { BrowsePopularProductsFacadeDto } from 'src/product/presentation/dto/request/browse-popular-products-facade.dto';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

export const IBrowsePopularProductsFacadeUseCaseToken = Symbol(
  'IBrowsePopularProductsFacadeUseCase',
);

export interface IBrowsePopularProductsFacadeUseCase
  extends IUseCase<BrowsePopularProductsFacadeDto, ProductDto[]> {}
