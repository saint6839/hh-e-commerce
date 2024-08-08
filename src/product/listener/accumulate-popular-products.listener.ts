import { Inject, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SendSlackMessageEvent } from 'src/common/slack/event/send-slack.event';
import {
  IAccumulatePopularProductsSoldUseCase,
  IAccumulatePopularProductsSoldUseCaseToken,
} from '../domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { AccumulatePopularProductsSoldEvent } from '../event/accumulate-popular-products-sold.event';
import { AccumulatePopularProductsSoldDto } from '../presentation/dto/request/accumulate-popular-products-sold.dto';

@EventsHandler(AccumulatePopularProductsSoldEvent)
export class AccumulatePopularProductsSoldListener
  implements IEventHandler<AccumulatePopularProductsSoldEvent>
{
  private readonly logger = new Logger(
    AccumulatePopularProductsSoldListener.name,
  );
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(
    @Inject(IAccumulatePopularProductsSoldUseCaseToken)
    private readonly accumulatePopularProductsSoldUseCase: IAccumulatePopularProductsSoldUseCase,
    private readonly eventBus: EventBus,
  ) {}

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
    this.eventBus.publish(
      new SendSlackMessageEvent(
        '#error-alerts',
        `🚨 Error in AccumulatePopularProductsSoldListener: ${message}`,
      ),
    );
  }
}
