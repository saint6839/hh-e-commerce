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
