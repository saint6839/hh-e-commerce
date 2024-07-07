import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, ValidateNested } from 'class-validator';
import { AddCartProductDetailDto } from './add-cart-product-detail.dto';

export class AddCartProductDto {
  @IsNumber()
  @ApiProperty({ example: 1 })
  readonly userId: number;

  @ValidateNested()
  @Type(() => AddCartProductDetailDto)
  @ApiProperty({
    type: AddCartProductDetailDto,
  })
  readonly product: AddCartProductDetailDto;
}
