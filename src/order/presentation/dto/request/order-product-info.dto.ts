import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OrderProductInfoDto {
  @IsNumber()
  @ApiProperty({ example: 1 })
  readonly productId: number;
  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 1 })
  readonly quantity: number;

  constructor(productId: number, quantity: number) {
    this.productId = productId;
    this.quantity = quantity;
  }
}
