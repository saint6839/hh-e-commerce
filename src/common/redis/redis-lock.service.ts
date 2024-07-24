import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly subscriber: Redis;
  private readonly publisher: Redis;
  private subscriptions: Map<string, { count: number; resolver: any[] }> =
    new Map();
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
    this.subscriber = this.redisClient.duplicate();
    this.publisher = this.redisClient.duplicate();

    this.subscriber.on('message', this.handleMessage.bind(this));
  }

  async onModuleDestroy() {
    this.redisClient.disconnect();
    this.subscriber.disconnect();
    this.publisher.disconnect();
  }

  private handleMessage(channel: string, message: string) {
    if (message === 'release') {
      const subscription = this.subscriptions.get(channel);
      if (subscription) {
        const resolver = subscription.resolver.shift();
        if (resolver) {
          resolver();
        }
        subscription.count--;
        if (subscription.count === 0) {
          this.subscriber.unsubscribe(channel);
          this.subscriptions.delete(channel);
        }
      }
    }
  }

  async acquireLock(resource: string, ttl: number): Promise<string> {
    const lockValue = Date.now().toString();
    const channel = `lock:${resource}`;

    const acquired = await this.redisClient.set(
      resource,
      lockValue,
      'PX',
      ttl,
      'NX',
    );
    if (acquired === 'OK') {
      this.logger.log(`Lock acquired: ${resource}`);
      return lockValue;
    }

    return new Promise((resolve) => {
      if (!this.subscriptions.has(channel)) {
        this.subscriber.subscribe(channel);
        this.subscriptions.set(channel, { count: 1, resolver: [resolve] });
      } else {
        const subscription = this.subscriptions.get(channel)!;
        subscription.count++;
        subscription.resolver.push(resolve);
      }
    }).then(() => this.acquireLock(resource, ttl));
  }

  async releaseLock(resource: string, value: string): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redisClient.eval(script, 1, resource, value);
    if (result === 1) {
      this.logger.log(`Lock released: ${resource}`);
      await this.publisher.publish(`lock:${resource}`, 'release');
    } else {
      this.logger.warn(`Failed to release lock: ${resource}`);
    }
  }
}
