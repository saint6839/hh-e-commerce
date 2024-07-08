import { ProductOptionEntity } from 'src/product/infrastructure/entity/product-option.entity';

export const NOT_ENOUGH_STOCK_ERROR = '재고가 부족합니다.';

export class ProductOption {
  private _id: number;
  private _name: string;
  private _price: number;
  private _stock: number;
  private _productId: number;

  constructor(
    id: number,
    name: string,
    price: number,
    stock: number,
    productId: number,
  ) {
    this._id = id;
    this._name = name;
    this._price = price;
    this._stock = stock;
    this._productId = productId;
  }

  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  get stock(): number {
    return this._stock;
  }

  get productId(): number {
    return this._productId;
  }

  decreaseStock(quantity: number): void {
    if (this._stock < quantity) {
      throw new Error(NOT_ENOUGH_STOCK_ERROR);
    }
    this._stock -= quantity;
  }

  restoreStock(quantity: number): void {
    this._stock += quantity;
  }

  static fromEntity(entity: ProductOptionEntity): ProductOption {
    return new ProductOption(
      entity.id,
      entity.name,
      entity.price,
      entity.stock,
      entity.productId,
    );
  }
}
