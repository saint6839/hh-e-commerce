import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
export class DecreaseProductStockDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  readonly productOptionId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  readonly quantity: number;

  constructor(productOptionId: number, quantity: number) {
    this.productOptionId = productOptionId;
    this.quantity = quantity;
  }
}
