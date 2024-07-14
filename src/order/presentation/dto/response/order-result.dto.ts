import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { OrderItemDto } from './order-item.dto';

export class OrderDto {
  @ApiProperty({ example: 1, description: '주문 ID' })
  @IsNumber()
  @IsOptional()
  readonly id: number;

  @ApiProperty({ example: 1, description: '사용자 ID' })
  @IsNumber()
  readonly userId: number;

  @ApiProperty({ example: 10000, description: '총 주문 금액' })
  @IsNumber()
  readonly totalPrice: number;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PENDING_PAYMENT,
    description: '주문 상태',
  })
  @IsEnum(OrderStatus)
  readonly status: OrderStatus;

  @ApiProperty({
    example: '2023-05-20T10:30:00Z',
    description: '주문 생성 시간',
  })
  @IsDate()
  @Type(() => Date)
  readonly orderedAt: Date;

  @ApiProperty({ type: [OrderItemDto], description: '주문 항목 목록' })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemDto)
  readonly orderItems: OrderItemDto[];

  @ApiProperty({
    example: null,
    description: '주문 삭제 시간',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly deletedAt?: Date | null;

  constructor(
    id: number,
    userId: number,
    totalPrice: number,
    status: OrderStatus,
    orderedAt: Date,
    orderItems: OrderItemDto[],
    deletedAt: Date | null = null,
  ) {
    this.id = id;
    this.userId = userId;
    this.totalPrice = totalPrice;
    this.status = status;
    this.orderedAt = orderedAt;
    this.orderItems = orderItems;
    this.deletedAt = deletedAt;
  }
}
