import { CartEntity } from 'src/cart/infrastructure/entity/cart.entity';

export class Cart {
  private _id: number;
  private _userId: number;
  private _productOptionId: number;
  private _quantity: number;

  constructor(
    id: number,
    userId: number,
    productOptionId: number,
    quantity: number,
  ) {
    this._id = id;
    this._userId = userId;
    this._productOptionId = productOptionId;
    this._quantity = quantity;
  }

  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get productOptionId(): number {
    return this._productOptionId;
  }

  get quantity(): number {
    return this._quantity;
  }

  static of(
    id: number,
    userId: number,
    productOptionId: number,
    quantity: number,
  ): Cart {
    return new Cart(id, userId, productOptionId, quantity);
  }

  static fromEntity(cart: CartEntity): Cart {
    return new Cart(cart.id, cart.userId, cart.productOptionId, cart.quantity);
  }
}
