import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate } from 'class-validator';

export class BrowsePopularProductsFacadeDto {
  @ApiProperty({ example: '2021-08-01T00:00:00' })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  readonly from: Date;

  @ApiProperty({ example: '2021-08-31T23:59:59' })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  readonly to: Date;

  constructor(from: Date, to: Date) {
    this.from = from;
    this.to = to;
  }
}
