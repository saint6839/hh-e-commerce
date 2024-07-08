import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OrderProductInfoDto {
  @IsNumber()
  @ApiProperty({ example: 1, description: '상품 ID' })
  readonly productId: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 1, description: '주문 수량' })
  readonly quantity: number;

  constructor(productId: number, quantity: number) {
    this.productId = productId;
    this.quantity = quantity;
  }
}
