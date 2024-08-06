import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LoggerService } from 'src/common/logger/logger.service';
import { PaymentCompletedEvent } from '../event/payment-completed.event';

@Injectable()
@EventsHandler(PaymentCompletedEvent)
export class PaymentCompletedListener
  implements IEventHandler<PaymentCompletedEvent>
{
  constructor(private readonly loggerService: LoggerService) {}

  async handle(event: PaymentCompletedEvent) {
    try {
      //   await this.externalDataPlatformService.saveOrderData({
      //     orderId: event.orderId,
      //     userId: event.userId,
      //     amount: event.amount,
      //     status: event.status,
      //   });
      this.loggerService.log(
        `주문 정보 외부 저장 성공: OrderID=${event.orderId}`,
        PaymentCompletedListener.name,
      );
    } catch (error) {
      this.loggerService.error(
        `주문 정보 외부 저장 실패: OrderID=${event.orderId}, Error=${error.message}`,
        PaymentCompletedListener.name,
      );
      // 여기서 실패한 이벤트를 재시도 큐에 넣거나, 알림을 보내는 등의 추가 처리를 할 수 있습니다.
      await this.handleFailedExternalSave(event);
    }
  }

  private async handleFailedExternalSave(event: PaymentCompletedEvent) {
    // 실패한 이벤트 처리 로직
    // 예: 재시도 큐에 넣기, 관리자에게 알림 보내기 등
    this.loggerService.warn(
      `주문 정보 외부 저장 실패 처리 시작: OrderID=${event.orderId}`,
      PaymentCompletedListener.name,
    );
    // 구체적인 실패 처리 로직 구현
  }
}
