import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { AccumulatePopularProductsSoldDto } from 'src/product/presentation/dto/request/accumulate-popular-products-sold.dto';

export const IAccumulatePopularProductsSoldUseCaseToken = Symbol(
  'IAccumulatePopularProductsSoldUseCase',
);

export interface IAccumulatePopularProductsSoldUseCase
  extends IUseCase<AccumulatePopularProductsSoldDto, void> {}
