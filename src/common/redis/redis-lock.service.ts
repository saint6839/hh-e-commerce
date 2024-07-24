import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock, { ExecutionError } from 'redlock';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly redlock: Redlock;

  constructor(
    private readonly logger: LoggerService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    this.redisClient =
      redisClient ||
      new Redis({
        host: 'localhost',
        port: 6379,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

    // Redlock 인스턴스 생성
    this.redlock = new Redlock([this.redisClient], {
      retryCount: 25,
      retryDelay: 400,
      retryJitter: 50,
      automaticExtensionThreshold: 500,
    });

    // Redlock의 clientError 이벤트 핸들러
    this.redlock.on('clientError', (err) => {
      this.logger.error('A redis error has occurred:', err);
    });
  }

  async onModuleDestroy() {
    this.redisClient.disconnect();
    this.redlock.quit();
  }

  // 락 획득 메서드
  async acquireLock(resource: string, ttl: number): Promise<any> {
    try {
      const lock = await this.redlock.acquire([resource], ttl);
      this.logger.log(`Lock acquired: ${resource}`);
      return lock;
    } catch (err) {
      if (err instanceof ExecutionError) {
        this.logger.warn(`Resource is locked: ${resource}`);
      } else {
        this.logger.error(`Failed to acquire lock: ${resource}`, err);
      }
      throw err;
    }
  }

  // 락 해제 메서드
  async releaseLock(lock: any): Promise<void> {
    try {
      await lock.release();
      this.logger.log(`Lock released: ${lock.resources}`);
    } catch (err) {
      this.logger.error(`Failed to release lock: ${lock.resources}`, err);
      throw err;
    }
  }
}
