import { IsNumber, Min } from 'class-validator';
export class AddCartProductDetailDto {
  @IsNumber()
  readonly productId: number;
  @IsNumber()
  @Min(1)
  readonly quantity: number;

  constructor(productId: number, quantity: number) {
    this.productId = productId;
    this.quantity = quantity;
  }
}