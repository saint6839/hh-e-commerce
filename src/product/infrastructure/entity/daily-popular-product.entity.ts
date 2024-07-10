import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const INVALID_QUANTITY_ERROR = '판매량은 0보다 작을 수 없습니다.';

@Entity('daily_popular_products')
export class DailyPopularProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column()
  productOptionId: number;

  @Column()
  totalSold: number;

  @Column()
  soldDate: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  static of(
    productId: number,
    productOptionId: number,
    totalSold: number,
    soldDate: Date,
  ): DailyPopularProductEntity {
    const dailyPopularProduct = new DailyPopularProductEntity();
    dailyPopularProduct.productId = productId;
    dailyPopularProduct.productOptionId = productOptionId;
    dailyPopularProduct.totalSold = totalSold;
    dailyPopularProduct.soldDate = soldDate;
    return dailyPopularProduct;
  }

  accumulateTotalSold(quantity: number): void {
    if (quantity < 0) throw new Error(INVALID_QUANTITY_ERROR);
    this.totalSold += quantity;
  }
}
