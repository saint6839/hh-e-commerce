import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from 'src/common/logger/logger.service';
import { CacheService } from 'src/common/redis/redis-cache.service';
import {
  IBrowseProductsUseCase,
  IBrowseProductsUseCaseToken,
} from '../domain/interface/usecase/browse-products.usecase.interface';

@Injectable()
export class BrowseProductsCacheService {
  constructor(
    @Inject(IBrowseProductsUseCaseToken)
    private readonly browseProductsUseCase: IBrowseProductsUseCase,
    private readonly loggerService: LoggerService,
    private readonly cacheService: CacheService,
  ) {}

  private getCacheKey(): string {
    return 'all_products1';
  }

  /**
   * 새로운 상품이 추가될 경우에 캐시를 eviction 할 수도 있지만, 현재 요구 사항에서는 상품 추가 기능이 없고
   * 상품의 추가가 즉각적으로 이루어지지 않아도 되는 요구사항이라고 판단하여 스케줄러를 통해 주기적으로 캐시를 갱신하도록 하였습니다.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async refreshProductsCache() {
    try {
      const products = await this.browseProductsUseCase.execute();
      const cacheKey = this.getCacheKey();
      await this.cacheService.set(cacheKey, JSON.stringify(products), 600);
    } catch (error) {
      this.loggerService.error('Failed to refresh products cache', error);
    }
  }
}
