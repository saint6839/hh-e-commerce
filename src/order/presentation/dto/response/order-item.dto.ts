import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';

type ProductWithoutStock = Omit<ProductDto, 'stock'>;

export class OrderItemDto {
  @ApiProperty({ example: 1, description: '주문 항목 ID' })
  @IsNumber()
  readonly id: number;

  @ApiProperty({ example: 1, description: '주문 ID' })
  @IsNumber()
  readonly orderId: number;

  @ApiProperty({ type: ProductDto, description: '상품 정보' })
  @IsNumber()
  readonly product: ProductWithoutStock;

  @ApiProperty({ example: 2, description: '주문 수량' })
  @IsNumber()
  @Min(1)
  readonly quantity: number;

  @ApiProperty({ example: 10000, description: '상품 가격' })
  @IsNumber()
  readonly price: number;

  constructor(
    id: number,
    orderId: number,
    product: ProductWithoutStock,
    quantity: number,
    price: number,
  ) {
    this.id = id;
    this.orderId = orderId;
    this.product = product;
    this.quantity = quantity;
    this.price = price;
  }
}
