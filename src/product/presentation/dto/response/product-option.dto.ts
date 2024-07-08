import { ApiProperty } from '@nestjs/swagger';

export class ProductOptionDto {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: 'Red' })
  readonly name: string;
  @ApiProperty({ example: 100000 })
  readonly price: number;
  @ApiProperty({ example: 10 })
  readonly stock: number;
  @ApiProperty({ example: 1 })
  readonly productId: number;

  constructor(
    id: number,
    name: string,
    price: number,
    stock: number,
    productId: number,
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
    this.productId = productId;
  }
}
