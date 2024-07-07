import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';

export class OrderResultDto {
  @ApiProperty({ example: 1 })
  readonly orderId: number;

  @ApiProperty({ example: 1 })
  readonly userId: number;

  @ApiProperty({ example: 1000 })
  readonly totalPrice: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CREATED })
  readonly status: OrderStatus;

  @ApiProperty({ example: '2023-05-20T10:30:00Z' })
  readonly createdAt: Date;

  constructor(
    orderId: number,
    userId: number,
    totalPrice: number,
    status: OrderStatus,
    createdAt: Date,
  ) {
    this.orderId = orderId;
    this.userId = userId;
    this.totalPrice = totalPrice;
    this.status = status;
    this.createdAt = createdAt;
  }
}
