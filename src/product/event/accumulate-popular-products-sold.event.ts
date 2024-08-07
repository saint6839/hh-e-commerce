import { OrderItemDto } from 'src/order/presentation/dto/response/order-item.dto';

export class AccumulatePopularProductsSoldEvent {
  constructor(public readonly orderItems: OrderItemDto[]) {}
}
