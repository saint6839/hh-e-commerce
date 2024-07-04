import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

export class CartItemDto {
  readonly product: ProductDto;
  readonly quantity: number;

  constructor(product: ProductDto, quantity: number) {
    this.product = product;
    this.quantity = quantity;
  }
}
