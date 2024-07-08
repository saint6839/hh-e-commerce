import { OrderItem } from 'src/order/domain/entity/order-item';
import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  productId: number;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column()
  totalPriceAtOrder: number;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;

  static of(
    orderId: number,
    productId: number,
    productName: string,
    quantity: number,
    totalPriceAtOrder: number,
  ): OrderItemEntity {
    const orderItem = new OrderItemEntity();
    orderItem.orderId = orderId;
    orderItem.productId = productId;
    orderItem.productName = productName;
    orderItem.quantity = quantity;
    orderItem.totalPriceAtOrder = totalPriceAtOrder;
    return orderItem;
  }

  static fromEntity(entity: OrderItemEntity): OrderItem {
    return new OrderItem(
      entity.id,
      entity.orderId,
      entity.productId,
      entity.productName,
      entity.quantity,
      entity.totalPriceAtOrder,
    );
  }
}
