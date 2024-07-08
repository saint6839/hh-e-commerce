import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('carts')
export class CartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productOptionId: number;

  @Column()
  quantity: number;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt?: Date | null;

  static of(
    userId: number,
    productOptionId: number,
    quantity: number,
  ): CartEntity {
    const cart = new CartEntity();
    cart.userId = userId;
    cart.productOptionId = productOptionId;
    cart.quantity = quantity;
    return cart;
  }
}
