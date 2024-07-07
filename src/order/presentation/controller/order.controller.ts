import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import { OrderStatus } from 'src/order/domain/enum/order-status.enum';
import { OrderDto } from '../dto/request/order.dto';
import { OrderResultDto } from '../dto/response/order-result.dto';

@ApiTags('주문 관련 API')
@Controller('/api/v1/orders')
export class OrderController {
  @Post('/')
  @ApiSwaggerResponse(201, '주문서 생성 성공', OrderResultDto)
  async createOrder(
    @Body() dto: OrderDto,
  ): Promise<ApiResponseDto<OrderResultDto>> {
    const mockOrder = new OrderResultDto(
      1,
      dto.userId,
      1000,
      OrderStatus.CREATED,
      new Date(),
    );
    return new ApiResponseDto<OrderResultDto>(
      true,
      '주문서 생성 성공',
      mockOrder,
    );
  }
}
