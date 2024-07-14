import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from '../../domain/enum/order-status.enum';

export const NOT_FOUND_ORDER_ERROR = '주문을 찾을 수 없습니다.';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @CreateDateColumn()
  orderedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;

  static of(userId: number, totalPrice: number): OrderEntity {
    const order = new OrderEntity();
    order.userId = userId;
    order.totalPrice = totalPrice;
    return order;
  }

  complete(): void {
    this.status = OrderStatus.PAID;
  }

  fail(): void {
    this.status = OrderStatus.CANCELLED;
  }
}
