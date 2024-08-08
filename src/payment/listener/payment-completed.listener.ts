import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ExternalDataPlatformService } from 'src/common/data-platform/external-data-platform.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { SendSlackMessageEvent } from 'src/common/slack/event/send-slack.event';
import { PaymentCompletedEvent } from '../event/payment-completed.event';

@Injectable()
@EventsHandler(PaymentCompletedEvent)
export class PaymentCompletedListener
  implements IEventHandler<PaymentCompletedEvent>
{
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly eventBus: EventBus,
    private readonly externalDataPlatformService: ExternalDataPlatformService,
  ) {}

  async handle(event: PaymentCompletedEvent) {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        await this.externalDataPlatformService.saveOrderData({
          orderId: event.orderId,
          userId: event.userId,
          amount: event.amount,
          status: event.status,
        });
        this.loggerService.log(
          `주문 정보 외부 저장 성공: OrderID=${event.orderId}`,
          PaymentCompletedListener.name,
        );
        return; // 성공적으로 처리되면 함수 종료
      } catch (error) {
        retries++;
        this.loggerService.warn(
          `주문 정보 외부 저장 실패: OrderID=${event.orderId}. 재시도 ${retries}/${this.maxRetries}. 에러: ${error.message}`,
          PaymentCompletedListener.name,
        );
        if (retries < this.maxRetries) {
          await this.delay(this.retryDelay * retries);
        }
      }
    }

    // 모든 재시도가 실패한 경우
    const errorMessage = `총 ${this.maxRetries}번의 주문 정보 외부 저장 재시도를 실패하였습니다. OrderID=${event.orderId}`;
    this.loggerService.error(errorMessage, PaymentCompletedListener.name);
    this.sendSlackNotification(errorMessage);
    await this.handleFailedExternalSave(event);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private sendSlackNotification(message: string): void {
    this.eventBus.publish(
      new SendSlackMessageEvent(
        '#error-alerts',
        `🚨 Error in PaymentCompletedListener: ${message}`,
      ),
    );
  }

  private async handleFailedExternalSave(event: PaymentCompletedEvent) {
    this.loggerService.warn(
      `주문 정보 외부 저장 실패 처리 시작: OrderID=${event.orderId}`,
      PaymentCompletedListener.name,
    );
    // 여기에 추가적인 실패 처리 로직을 구현할 수 있습니다.
    // 예: 데이터베이스에 실패한 이벤트 저장, 다른 서비스에 알림 등
  }
}
