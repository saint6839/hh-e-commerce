import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
    private readonly createOrderFacadeUseCase: ICreateOrderFacadeUseCase,
  ) {}
  @Post('/')
  @ApiOperation({
    summary: '주문서 생성',
    description: '사용자가 주문할 상품들에 대한 주문서를 생성합니다.',
  })
  @ApiSwaggerResponse(201, '주문서 생성 성공', OrderDto)
  async createOrder(
    @Body() dto: CreateOrderFacadeDto,
  ): Promise<ApiResponseDto<OrderDto>> {
    return new ApiResponseDto<OrderDto>(
      true,
      '주문서 생성 성공',
      await this.createOrderFacadeUseCase.execute(dto),
    );
  }
}
