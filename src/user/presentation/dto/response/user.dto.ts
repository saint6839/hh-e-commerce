import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: '채상엽' })
  readonly name: string;
  @ApiProperty({ example: 1000 })
  readonly balance: number;

  constructor(id: number, name: string, balance: number) {
    this.id = id;
    this.name = name;
    this.balance = balance;
  }
}
