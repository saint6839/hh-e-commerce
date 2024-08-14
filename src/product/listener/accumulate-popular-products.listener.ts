import { Inject, Logger } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import {
  IAccumulatePopularProductsSoldUseCase,
  IAccumulatePopularProductsSoldUseCaseToken,
} from '../domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { AccumulatePopularProductsSoldEvent } from '../event/accumulate-popular-products-sold.event';
import { AccumulatePopularProductsSoldDto } from '../presentation/dto/request/accumulate-popular-products-sold.dto';

export class AccumulatePopularProductsSoldListener {
  private readonly logger = new Logger(
    AccumulatePopularProductsSoldListener.name,
  );
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(
    @Inject(IAccumulatePopularProductsSoldUseCaseToken)
    private readonly accumulatePopularProductsSoldUseCase: IAccumulatePopularProductsSoldUseCase,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  @MessagePattern('product.popular.accumulate')
  async handle(event: AccumulatePopularProductsSoldEvent) {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        await this.accumulatePopularProductsSoldUseCase.execute(
          new AccumulatePopularProductsSoldDto(event.orderItems),
        );
        return;
      } catch (error) {
        retries++;
        this.logger.warn(
          `인기 상품 판매량 누적 실패 ${JSON.stringify(event.orderItems)}. 재시도 ${retries}/${this.maxRetries}. 에러: ${error.message}`,
        );
        if (retries < this.maxRetries) {
          await this.delay(this.retryDelay * retries);
        }
      }
    }

    const errorMessage = ` 총 ${this.maxRetries}번의 인기상품 누적 재시도를 실패하였습니다. order items: ${JSON.stringify(event.orderItems)}`;
    this.logger.error(errorMessage);
    this.sendSlackNotification(errorMessage);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 에러 슬랙 알림 전송 이벤트 발행
   * @param message
   */
  private sendSlackNotification(message: string): void {
    this.kafkaClient.emit('slack.notification', {
      channel: '#error-alerts',
      text: `🚨 Error in AccumulatePopularProductsSoldListener: ${message}`,
    });
  }
}
