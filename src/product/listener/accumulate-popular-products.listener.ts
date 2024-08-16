import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import {
  IOutboxRepository,
  IOutboxRepositoryToken,
} from 'src/common/outbox/domain/interface/outbox.repository.interface';
import {
  IAccumulatePopularProductsSoldUseCase,
  IAccumulatePopularProductsSoldUseCaseToken,
} from '../domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { AccumulatePopularProductsSoldEvent } from '../event/accumulate-popular-products-sold.event';
import { AccumulatePopularProductsSoldDto } from '../presentation/dto/request/accumulate-popular-products-sold.dto';

@Injectable()
export class AccumulatePopularProductsSoldListener {
  private readonly logger = new Logger(
    AccumulatePopularProductsSoldListener.name,
  );
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(
    @Inject(IAccumulatePopularProductsSoldUseCaseToken)
    private readonly accumulatePopularProductsSoldUseCase: IAccumulatePopularProductsSoldUseCase,
    @Inject('PRODUCT_SERVICE') private readonly kafkaClient: ClientKafka,
    @Inject(IOutboxRepositoryToken)
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  @EventPattern('product.popular.accumulate')
  async handle(@Payload() event: AccumulatePopularProductsSoldEvent) {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        await this.accumulatePopularProductsSoldUseCase.execute(
          new AccumulatePopularProductsSoldDto(event.orderItems),
        );

        const outbox = await this.outboxRepository.findByEventTypeAndPayload(
          'product.popular.accumulate',
          JSON.stringify(event),
        );
        if (outbox) {
          await this.outboxRepository.markAsPublished(outbox.id);
          this.logger.log(`인기 상품 판매량 누적 성공: OutboxID=${outbox.id}`);
        } else {
          this.logger.warn(
            `Outbox 이벤트를 찾을 수 없습니다: ${JSON.stringify(event)}`,
          );
        }
        return;
      } catch (error) {
        retries++;
        this.logger.warn(
          `인기 상품 판매량 누적 실패. 재시도 ${retries}/${this.maxRetries}. 에러: ${error.message}`,
        );
        if (retries < this.maxRetries) {
          await this.delay(this.retryDelay * retries);
        }
      }
    }

    await this.handleMaxRetriesReached(event);
  }

  private async handleMaxRetriesReached(
    event: AccumulatePopularProductsSoldEvent,
  ) {
    const errorMessage = `총 ${this.maxRetries}번의 인기상품 누적 재시도를 실패하였습니다. order items: ${JSON.stringify(event.orderItems)}`;
    this.logger.error(errorMessage);
    await this.sendSlackNotification(errorMessage);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async sendSlackNotification(message: string): Promise<void> {
    try {
      this.kafkaClient.emit('slack.notification', {
        channel: '#error-alerts',
        text: `🚨 Error in AccumulatePopularProductsSoldListener: ${message}`,
      });
    } catch (error) {
      this.logger.error(`Slack 알림 전송 실패: ${error.message}`);
    }
  }
}
