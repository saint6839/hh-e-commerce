import { ApiProperty } from '@nestjs/swagger';
import { ProductOptionDto } from 'src/product/presentation/dto/response/product-option.dto';

export class CartItemDto {
  @ApiProperty({ type: ProductOptionDto })
  readonly productOption: ProductOptionDto;
  @ApiProperty({ example: 1 })
  readonly quantity: number;

  constructor(productOption: ProductOptionDto, quantity: number) {
    this.productOption = productOption;
    this.quantity = quantity;
  }
}
