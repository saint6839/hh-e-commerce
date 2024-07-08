import { OrderStatus } from '../enum/order-status.enum';

export class Order {
  private _id: number;
  private _userId: number;
  private _totalPrice: number;
  private _status: OrderStatus;
  private _orderedAt: Date;

  constructor(
    id: number,
    userId: number,
    totalPrice: number,
    status: OrderStatus,
    orderedAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._totalPrice = totalPrice;
    this._status = status;
    this._orderedAt = orderedAt;
  }

  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get totalPrice(): number {
    return this._totalPrice;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get orderedAt(): Date {
    return this._orderedAt;
  }
}
