import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ReadUserDto {
  @IsNumber()
  @ApiProperty({ example: 1 })
  readonly id: number;

  constructor(id: number) {
    this.id = id;
  }
}
