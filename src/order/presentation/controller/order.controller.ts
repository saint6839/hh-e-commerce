import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { OrderDto } from '../dto/request/order.dto';
import { OrderResultDto } from '../dto/response/order-result.dto';

@Controller('/api/v1/orders')
export class OrderController {
  @Post('/')
  async order(@Body() dto: OrderDto): Promise<ApiResponseDto<OrderResultDto>> {
    const mockOrder = new OrderResultDto(1000);
    return new ApiResponseDto<OrderResultDto>(
      true,
      '주문 및 결제 성공',
      mockOrder,
    );
  }
}
