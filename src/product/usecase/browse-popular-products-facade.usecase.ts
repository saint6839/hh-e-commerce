import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  IDailyPopularProductRepository,
  IDailyPopularProductRepositoryToken,
} from '../domain/interface/repository/daily-popular-product.repository.interface';
import { IBrowsePopularProductsFacadeUseCase } from '../domain/interface/usecase/browse-popular-products-facade.usecase.interface';
import {
  IReadProductUseCase,
  IReadProductUseCaseToken,
} from '../domain/interface/usecase/read-product.usecase.interface';
import { BrowsePopularProductsFacadeDto } from '../presentation/dto/request/browse-popular-products-facade.dto';
import { ProductDto } from '../presentation/dto/response/product.dto';

@Injectable()
export class BrowsePopularProductsFacadeUseCase
  implements IBrowsePopularProductsFacadeUseCase
{
  constructor(
    @Inject(IReadProductUseCaseToken)
    private readonly readProductUseCase: IReadProductUseCase,
    @Inject(IDailyPopularProductRepositoryToken)
    private readonly dailyPopularProductRepository: IDailyPopularProductRepository,
  ) {}

  async execute(
    dto: BrowsePopularProductsFacadeDto,
    entityManager?: EntityManager,
  ): Promise<ProductDto[]> {
    const dailyPopularProductEntities =
      await this.dailyPopularProductRepository.findTopSoldByDateRange(
        dto.from,
        dto.to,
        5,
        entityManager,
      );

    return await Promise.all(
      dailyPopularProductEntities.map(async (dailyPopularProductEntity) => {
        return await this.readProductUseCase.execute(
          dailyPopularProductEntity.productId,
        );
      }),
    );
  }
}
