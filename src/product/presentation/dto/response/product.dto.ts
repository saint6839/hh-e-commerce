import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { ProductOptionDto } from './product-option.dto';
export class ProductDto {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: '아이폰' })
  readonly name: string;
  @ApiProperty({ type: [ProductOptionDto] })
  readonly productOptions: ProductOptionDto[];
  @ApiProperty({ example: ProductStatus.ACTIVATE })
  readonly status: ProductStatus;

  constructor(
    id: number,
    name: string,
    productOptions: ProductOptionDto[],
    status: ProductStatus,
  ) {
    this.id = id;
    this.name = name;
    this.productOptions = productOptions;
    this.status = status;
  }
}
