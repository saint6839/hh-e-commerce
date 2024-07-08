import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
export class AddCartProductDetailDto {
  @IsNumber()
  @ApiProperty({ example: 1 })
  readonly userId: number;
  @IsNumber()
  @ApiProperty({ example: 1 })
  readonly productOptionId: number;
  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 1 })
  readonly quantity: number;

  constructor(userId: number, productOptionId: number, quantity: number) {
    this.userId = userId;
    this.productOptionId = productOptionId;
    this.quantity = quantity;
  }
}
