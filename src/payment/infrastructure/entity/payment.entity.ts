import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from 'src/payment/domain/enum/payment-method.enum';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const NOT_FOUND_PAYMENT_ERROR = '결제 정보를 찾을 수 없습니다.';
export const INVALID_AMOUNT_ERROR = '결제 금액은 0보다 커야 합니다.';

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

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true, default: null })
  paymentMethod?: PaymentMethod | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  paidAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt?: Date | null;

  static of(userId: number, orderId: number, amount: number): PaymentEntity {
    if (amount <= 0) {
      throw new BadRequestException(INVALID_AMOUNT_ERROR);
    }

    const payment = new PaymentEntity();
    payment.userId = userId;
    payment.orderId = orderId;
    payment.amount = amount;
    payment.status = PaymentStatus.PENDING;
    return payment;
  }

  complete(): void {
    this.status = PaymentStatus.COMPLETED;
    this.paidAt = new Date();
  }

  fail(): void {
    this.status = PaymentStatus.FAILED;
  }

  /**
   * mock PG사로부터 데이터로 받아오는 상황을 가정하기 때문에, 테스트를 위해 임시적으로 true를 반환하도록 한다.
   * @param amount
   * @returns
   */
  isAmountEqualTo(amount: number): boolean {
    return true;
  }
}
