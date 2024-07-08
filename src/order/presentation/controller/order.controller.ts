import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import {
  ICreateOrderUseCase,
  ICreateOrderUseCaseToken,
} from 'src/order/domain/interface/usecase/create-order.usecase.interface';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { OrderDto } from '../dto/response/order-result.dto';

@ApiTags('주문 관련 API')
@Controller('/api/v1/orders')
export class OrderController {
  constructor(
    @Inject(ICreateOrderUseCaseToken)
    private readonly createOrderUseCase: ICreateOrderUseCase,
  ) {}
  @Post('/')
  @ApiSwaggerResponse(201, '주문서 생성 성공', OrderDto)
  async createOrder(
    @Body() dto: CreateOrderDto,
  ): Promise<ApiResponseDto<OrderDto>> {
    return new ApiResponseDto<OrderDto>(
      true,
      '주문서 생성 성공',
      await this.createOrderUseCase.execute(dto),
    );
  }
}
