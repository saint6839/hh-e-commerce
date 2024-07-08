import { OrderItemDto } from 'src/order/presentation/dto/response/order-item.dto';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';

export class OrderItem {
  private _id: number;
  private _orderId: number;
  private _productId: number;
  private _productName: string;
  private _quantity: number;
  private _totalPriceAtOrder: number;

  constructor(
    id: number,
    orderId: number,
    productId: number,
    productName: string,
    quantity: number,
    totalPriceAtOrder: number,
  ) {
    this._id = id;
    this._orderId = orderId;
    this._productId = productId;
    this._productName = productName;
    this._quantity = quantity;
    this._totalPriceAtOrder = totalPriceAtOrder;
  }

  get id(): number {
    return this._id;
  }

  get orderId(): number {
    return this._orderId;
  }

  get productId(): number {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get quantity(): number {
    return this._quantity;
  }

  get totalPriceAtOrder(): number {
    return this._totalPriceAtOrder;
  }

  get pricePerItem(): number {
    return this._totalPriceAtOrder / this._quantity;
  }

  static fromEntity(entity: OrderItemEntity): OrderItem {
    return new OrderItem(
      entity.id,
      entity.orderId,
      entity.productOptionId,
      entity.productName,
      entity.quantity,
      entity.totalPriceAtOrder,
    );
  }

  toDto(): OrderItemDto {
    return new OrderItemDto(
      this._id,
      this._orderId,
      this._productId,
      this._quantity,
      this._totalPriceAtOrder,
    );
  }
}
