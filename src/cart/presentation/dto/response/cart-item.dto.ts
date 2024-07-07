import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

export class CartItemDto {
  @ApiProperty({ type: ProductDto })
  readonly product: ProductDto;
  @ApiProperty({ example: 1 })
  readonly quantity: number;

  constructor(product: ProductDto, quantity: number) {
    this.product = product;
    this.quantity = quantity;
  }
}
