import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
export class ProductDto {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: '아이폰' })
  readonly name: string;
  @ApiProperty({ example: 1000000 })
  readonly price: number;
  @ApiProperty({ example: 10 })
  readonly stock: number;
  @ApiProperty({ example: ProductStatus.ACTIVATE })
  readonly status: ProductStatus;

  constructor(
    id: number,
    name: string,
    price: number,
    stock: number,
    status: ProductStatus,
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
    this.status = status;
  }
}
