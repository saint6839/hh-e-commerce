import { ApiProperty } from '@nestjs/swagger';
export class ProductDto {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: '아이폰' })
  readonly name: string;
  @ApiProperty({ example: 1000000 })
  readonly price: number;
  @ApiProperty({ example: 10 })
  readonly stock: number;

  constructor(id: number, name: string, price: number, stock: number) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
  }
}
