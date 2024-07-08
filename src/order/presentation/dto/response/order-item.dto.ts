import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 1, description: '주문 항목 ID' })
  @IsNumber()
  readonly id: number;

  @ApiProperty({ example: 1, description: '주문 ID' })
  @IsNumber()
  readonly orderId: number;

  @ApiProperty({ example: 1, description: '상품 옵션 ID' })
  @IsNumber()
  readonly productOptionId: number;

  @ApiProperty({ example: 2, description: '주문 수량' })
  @IsNumber()
  @Min(1)
  readonly quantity: number;

  @ApiProperty({ example: 10000, description: '상품 가격' })
  @IsNumber()
  readonly totalPriceAtOrder: number;

  constructor(
    id: number,
    orderId: number,
    productOptionId: number,
    quantity: number,
    totalPriceAtOrder: number,
  ) {
    this.id = id;
    this.orderId = orderId;
    this.productOptionId = productOptionId;
    this.quantity = quantity;
    this.totalPriceAtOrder = totalPriceAtOrder;
  }
}
