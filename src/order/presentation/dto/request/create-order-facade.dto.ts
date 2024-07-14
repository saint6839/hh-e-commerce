import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { OrderProductInfoDto } from './order-product-info.dto';

export class CreateOrderFacadeDto {
  @IsNumber()
  @ApiProperty({ example: 1, description: '사용자 ID' })
  readonly userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderProductInfoDto)
  @ApiProperty({
    type: [OrderProductInfoDto],
    description: '주문할 상품 목록',
    isArray: true,
    example: [
      {
        productOptionId: 1,
        quantity: 2,
      },
      {
        productOptionId: 2,
        quantity: 1,
      },
    ],
  })
  readonly productOptions: OrderProductInfoDto[];

  constructor(userId: number, productOptions: OrderProductInfoDto[]) {
    this.userId = userId;
    this.productOptions = productOptions;
  }
}
