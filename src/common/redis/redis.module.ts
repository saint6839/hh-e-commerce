import { Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { LoggerService } from '../logger/logger.service';
import { RedisLockService } from './redis-lock.service';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6389', 10),
        });
      },
    },
    RedisLockService,
    LoggerService,
  ],
  exports: [RedisLockService, 'REDIS_CLIENT'],
})
export class RedisModule {}
