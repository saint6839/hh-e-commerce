import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import {
  ICreateOrderFacadeUseCase,
  ICreateOrderFacadeUseCaseToken,
} from 'src/order/domain/interface/usecase/create-order-facade.usecase.interface';
import { CreateOrderFacadeDto } from '../dto/request/create-order-facade.dto';
import { OrderDto } from '../dto/response/order-result.dto';

@ApiTags('주문 관련 API')
@Controller('/api/v1/orders')
export class OrderController {
  constructor(
    @Inject(ICreateOrderFacadeUseCaseToken)
    private readonly createOrderUseCase: ICreateOrderFacadeUseCase,
  ) {}
  @Post('/')
  @ApiSwaggerResponse(201, '주문서 생성 성공', OrderDto)
  async createOrder(
    @Body() dto: CreateOrderFacadeDto,
  ): Promise<ApiResponseDto<OrderDto>> {
    return new ApiResponseDto<OrderDto>(
      true,
      '주문서 생성 성공',
      await this.createOrderUseCase.execute(dto),
    );
  }
}
