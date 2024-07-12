import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ICancelOrderUseCase,
  ICancelOrderUseCaseToken,
} from './../domain/interface/usecase/cancel-order.usecase.interface';

@Injectable()
export class OrderEventListener {
  private cancelDelay: number = 15 * 60 * 1000; // 15분

  constructor(
    @Inject(ICancelOrderUseCaseToken)
    private readonly cancelOrderUseCase: ICancelOrderUseCase,
  ) {}

  setCancelDelay(delay: number) {
    this.cancelDelay = delay;
  }

  /**
   * 일정 시간이 지났을때가지 결제가 일어나지 않았을 경우 주문을 취소하는 usecase를 호출하는 이벤트 핸들러
   * @param payload
   */
  @OnEvent('order.created')
  async handleOrderCreatedEvent(payload: { orderId: number }) {
    setTimeout(async () => {
      await this.cancelOrderUseCase.execute(payload.orderId);
    }, this.cancelDelay);
  }
}
