import { ProductStatus } from '../enum/product-status.enum';

export const NOT_ENOUGH_STOCK_ERROR = '재고가 부족합니다.';

export class Product {
  private _id: number;
  private _name: string;
  private _status: ProductStatus;

  constructor(id: number, name: string, status: ProductStatus) {
    this._id = id;
    this._name = name;
    this._status = status;
  }

  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get status(): ProductStatus {
    return this._status;
  }
}
