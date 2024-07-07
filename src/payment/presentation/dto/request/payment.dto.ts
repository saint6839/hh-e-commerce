import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { PaymentMethod } from 'src/payment/domain/enum/payment-method.enum';

export class PaymentDto {
  @IsNumber()
  @ApiProperty({ example: 1 })
  readonly orderId: number;

  @IsNumber()
  @ApiProperty({ example: 1000 })
  readonly amount: number;

  @IsEnum(PaymentMethod)
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
  readonly paymentMethod: PaymentMethod;

  constructor(orderId: number, amount: number, paymentMethod: PaymentMethod) {
    this.orderId = orderId;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
  }
}
