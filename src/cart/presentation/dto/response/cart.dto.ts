import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @ApiProperty({ example: 1 })
  readonly userId: number;
  @ApiProperty({
    type: [CartItemDto],
  })
  readonly cartItems: CartItemDto[];

  constructor(userId: number, cartItems: CartItemDto[]) {
    this.userId = userId;
    this.cartItems = cartItems;
  }
}
