import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChargeUserDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ example: 1 })
  readonly userId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ example: 1000 })
  readonly amount: number;

  constructor(userId: number, amount: number) {
    this.userId = userId;
    this.amount = amount;
  }
}
