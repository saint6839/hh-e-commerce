import { CartItemDto } from './cart-item.dto';

export class CartDto {
  readonly userId: number;
  readonly cartItems: CartItemDto[];

  constructor(userId: number, cartItems: CartItemDto[]) {
    this.userId = userId;
    this.cartItems = cartItems;
  }
}
