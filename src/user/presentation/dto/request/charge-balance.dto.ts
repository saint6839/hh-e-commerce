import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChargeBalanceDto {
  @IsNotEmpty()
  @IsNumber()
  readonly userId: number;

  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  constructor(userId: number, amount: number) {
    this.userId = userId;
    this.amount = amount;
  }
}
