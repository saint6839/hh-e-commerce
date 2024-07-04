import { Type } from 'class-transformer';
import { IsNumber, ValidateNested } from 'class-validator';
import { AddCartProductDetailDto } from './add-cart-product-detail.dto';

export class AddCartProductDto {
  @IsNumber()
  readonly userId: number;

  @ValidateNested()
  @Type(() => AddCartProductDetailDto)
  readonly product: AddCartProductDetailDto;
}
