import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { ExternalDataPlatformService } from 'src/common/data-platform/external-data-platform.service';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  IOutboxRepository,
  IOutboxRepositoryToken,
} from 'src/common/outbox/domain/interface/outbox.repository.interface';
import { PaymentCompletedEvent } from '../event/payment-completed.event';

@Injectable()
export class PaymentCompletedListener {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(
    private readonly loggerService: LoggerService,
    @Inject('PAYMENT_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly externalDataPlatformService: ExternalDataPlatformService,
    @Inject(IOutboxRepositoryToken)
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  @EventPattern('payment.completed')
  async handle(@Payload() event: PaymentCompletedEvent) {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        await this.externalDataPlatformService.saveOrderData({
          orderId: event.orderId,
          userId: event.userId,
          amount: event.amount,
          status: event.status,
        });

        const outbox = await this.outboxRepository.findByEventTypeAndPayload(
          'payment.completed',
          JSON.stringify(event),
        );
        if (outbox) await this.outboxRepository.markAsPublished(outbox.id);

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
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private sendSlackNotification(message: string): void {
    this.kafkaClient.emit('slack.notification', {
      channel: '#error-alerts',
      text: `🚨 Error in PaymentCompletedListener: ${message}`,
    });
  }
}
