import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import {
  ICompletePaymentFacadeUseCase,
  ICompletePaymentFacadeUseCaseToken,
} from 'src/payment/domain/interface/usecase/complete-payment-facade.usecase.interface';
import { CompletePaymentFacadeDto } from '../dto/request/complete-payment-facade.dto';
import { PaymentResultDto } from '../dto/response/payment-result.dto';
@ApiTags('결제 관련 API')
@Controller('/api/v1/payments')
export class PaymentController {
  constructor(
    @Inject(ICompletePaymentFacadeUseCaseToken)
    private readonly completePaymentFacadeUseCase: ICompletePaymentFacadeUseCase,
  ) {}

  @Post('/')
  @ApiOperation({
    summary: '결제',
    description: '사용자가 주문한 상품을 결제합니다.',
  })
  @ApiSwaggerResponse(200, '결제 성공', PaymentResultDto)
  async order(
    @Body() dto: CompletePaymentFacadeDto,
  ): Promise<ApiResponseDto<PaymentResultDto>> {
    return new ApiResponseDto<PaymentResultDto>(
      true,
      '결제 성공',
      await this.completePaymentFacadeUseCase.execute(dto),
    );
  }
}
