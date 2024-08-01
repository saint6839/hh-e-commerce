import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { CacheService } from 'src/common/redis/redis-cache.service';
import { DataSource, EntityManager } from 'typeorm';
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
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly loggerService: LoggerService,
  ) {}

  private getCacheKey(from: Date, to: Date): string {
    return `popular_products:${from.toISOString()}:${to.toISOString()}`;
  }

  async execute(
    dto: BrowsePopularProductsFacadeDto,
    entityManager?: EntityManager,
  ): Promise<ProductDto[]> {
    let result: ProductDto[];

    const cacheKey = this.getCacheKey(dto.from, dto.to);
    const cachedResult = await this.cacheService.get(cacheKey);

    if (cachedResult) {
      result = JSON.parse(cachedResult);
    } else {
      const transactionCallback = async (manager: EntityManager) => {
        const dailyPopularProductEntities =
          await this.dailyPopularProductRepository.findTopSoldByDateRange(
            dto.from,
            dto.to,
            5,
            manager,
          );

        const products = await Promise.all(
          dailyPopularProductEntities.map(async (dailyPopularProductEntity) => {
            return await this.readProductUseCase.execute(
              dailyPopularProductEntity.productId,
              manager,
            );
          }),
        );

        await this.cacheService.set(cacheKey, JSON.stringify(products), 1800);

        return products;
      };

      if (entityManager) {
        result = await transactionCallback(entityManager);
      } else {
        result = await this.dataSource.transaction(transactionCallback);
      }
    }
    return result;
  }
}
