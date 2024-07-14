import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const NOT_FOUND_PRODUCT_OPTION_ERROR = '상품 옵션이 존재하지 않습니다.';

@Entity('product_options')
export class ProductOptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @Column()
  productId: number;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt?: Date | null;
}
