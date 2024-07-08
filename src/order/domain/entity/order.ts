import { OrderDto } from 'src/order/presentation/dto/response/order-result.dto';
import { OrderItemEntity } from 'src/order/repository/entity/order-item.entity';
import { OrderEntity } from 'src/order/repository/entity/order.entity';
import { OrderStatus } from '../enum/order-status.enum';
import { OrderItem } from './order-item';

export class Order {
  private _id: number;
  private _userId: number;
  private _totalPrice: number;
  private _status: OrderStatus;
  private _orderedAt: Date;
  private _orderItems: OrderItem[];

  constructor(
    id: number,
    userId: number,
    status: OrderStatus,
    orderedAt: Date,
    orderItems: OrderItem[] = [],
  ) {
    this._id = id;
    this._userId = userId;
    this._status = status;
    this._orderedAt = orderedAt;
    this._orderItems = orderItems;
    this._totalPrice = this.calculateTotalPrice();
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

  /**
   * 불변성을 위해 복사본을 반환
   */
  get orderItems(): OrderItem[] {
    return [...this._orderItems];
  }

  static of(userId: number, orderItems: OrderItem[] = []): Order {
    return new Order(
      0,
      userId,
      OrderStatus.PENDING_PAYMENT,
      new Date(),
      orderItems,
    );
  }

  static fromEntity(
    entity: OrderEntity,
    orderItemEntities: OrderItemEntity[] = [],
  ): Order {
    return new Order(
      entity.id,
      entity.userId,
      entity.status,
      entity.orderedAt,
      orderItemEntities.map((item) => OrderItem.fromEntity(item)),
    );
  }

  toDto(): OrderDto {
    return new OrderDto(
      this._id,
      this._userId,
      this._totalPrice,
      this._status,
      this._orderedAt,
      this._orderItems.map((item) => item.toDto()),
    );
  }

  private calculateTotalPrice(): number {
    return this._orderItems.reduce(
      (total, item) => total + item.totalPriceAtOrder,
      0,
    );
  }

  public addOrderItems(orderItems: OrderItem[]): void {
    this._orderItems.push(...orderItems);
    this._totalPrice = this.calculateTotalPrice();
  }

  public cancel(): void {
    this._status = OrderStatus.CANCELLED;
  }

  public isCancelable(): boolean {
    return this._status === OrderStatus.PENDING_PAYMENT;
  }
}
