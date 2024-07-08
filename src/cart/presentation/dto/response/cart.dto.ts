import { ApiProperty } from '@nestjs/swagger';
import { ProductOptionDto } from 'src/product/presentation/dto/response/product-option.dto';

export class CartDto {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ type: ProductOptionDto })
  readonly productOption: ProductOptionDto;
  @ApiProperty({ example: 1 })
  readonly quantity: number;

  constructor(id: number, productOption: ProductOptionDto, quantity: number) {
    this.id = id;
    this.productOption = productOption;
    this.quantity = quantity;
  }
}
