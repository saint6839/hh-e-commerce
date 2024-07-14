import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OrderProductInfoDto {
  @IsNumber()
  @ApiProperty({ example: 1, description: '상품 옵션 ID' })
  readonly productOptionId: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 1, description: '주문 수량' })
  readonly quantity: number;

  constructor(productOptionId: number, quantity: number) {
    this.productOptionId = productOptionId;
    this.quantity = quantity;
  }
}
