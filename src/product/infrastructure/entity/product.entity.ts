import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const NOT_FOUND_PRODUCT_ERROR = '존재하지 않는 상품입니다.';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DEACTIVATE,
  })
  status: ProductStatus;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;
}
