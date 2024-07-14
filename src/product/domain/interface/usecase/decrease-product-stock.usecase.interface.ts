import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { DecreaseProductStockDto } from 'src/product/presentation/dto/request/decrease-product-stock.dto';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

export const IDecreaseProductStockUsecaseToken = Symbol(
  'IDecreaseProductStockUsecase',
);

export interface IDecreaseProductStockUsecase
  extends IUseCase<DecreaseProductStockDto, ProductDto> {}
