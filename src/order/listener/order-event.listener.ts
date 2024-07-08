import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ICancelOrderUseCase,
  ICancelOrderUseCaseToken,
} from './../domain/interface/usecase/cancel-order.usecase.interface';

@Injectable()
export class OrderEventListener {
  private cancelDelay: number = 15 * 60 * 1000;

  constructor(
    @Inject(ICancelOrderUseCaseToken)
    private readonly cancelOrderUseCase: ICancelOrderUseCase,
  ) {}

  setCancelDelay(delay: number) {
    this.cancelDelay = delay;
  }

  @OnEvent('order.created')
  async handleOrderCreatedEvent(payload: { orderId: number }) {
    setTimeout(async () => {
      await this.cancelOrderUseCase.execute(payload.orderId);
    }, this.cancelDelay);
  }
}
