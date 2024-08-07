import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from 'src/payment/domain/enum/payment-method.enum';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';

export class PaymentResultDto {
  @ApiProperty({ example: 1 })
  readonly paymentId: number;

  @ApiProperty({ example: 1 })
  readonly userId: number;

  @ApiProperty({ example: 1 })
  readonly orderId: number;

  @ApiProperty({ example: 1000 })
  readonly amount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.COMPLETED })
  readonly status: PaymentStatus;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
    nullable: true,
  })
  readonly paymentMethod?: PaymentMethod | null;

  @ApiProperty({ example: '2021-08-01T00:00:00', nullable: true })
  readonly paidAt?: Date | null;

  constructor(
    paymentId: number,
    userId: number,
    orderId: number,
    amount: number,
    status: PaymentStatus,
    paymentMethod?: PaymentMethod | null,
    paidAt?: Date | null,
  ) {
    this.paymentId = paymentId;
    this.userId = userId;
    this.orderId = orderId;
    this.amount = amount;
    this.status = status;
    this.paymentMethod = paymentMethod;
    this.paidAt = paidAt;
  }
}
