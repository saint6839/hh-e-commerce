import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  orderId: number;

  @Column()
  amount: number;

  @Column()
  paymentMethod: string;

  @Column()
  status: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true, default: null })
  paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;
}
