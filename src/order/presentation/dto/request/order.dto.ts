import { Type } from 'class-transformer';
import { ArrayMinSize, IsNumber, ValidateNested } from 'class-validator';
import { OrderProductInfoDto } from './order-product-info.dto';

export class OrderDto {
  @IsNumber()
  readonly userId: number;
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderProductInfoDto)
  readonly products: OrderProductInfoDto[];

  constructor(userId: number, products: OrderProductInfoDto[]) {
    this.userId = userId;
    this.products = products;
  }
}
