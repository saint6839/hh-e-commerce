import { OrderItemDto } from './../../../../order/presentation/dto/response/order-item.dto';

export class AccumulatePopularProductsSoldDto {
  readonly orderItems: OrderItemDto[];

  constructor(orderItems: OrderItemDto[]) {
    this.orderItems = orderItems;
  }
}
