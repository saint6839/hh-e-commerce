import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CompletePaymentFacadeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  readonly paymentId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  readonly userId: number;

  @ApiProperty({ example: '130912830918' })
  @IsNumber()
  readonly mid: string;

  @ApiProperty({ example: '234098120394' })
  @IsNumber()
  readonly tid: string;

  constructor(paymentId: number, userId: number, mid: string, tid: string) {
    this.paymentId = paymentId;
    this.userId = userId;
    this.mid = mid;
    this.tid = tid;
  }
}
