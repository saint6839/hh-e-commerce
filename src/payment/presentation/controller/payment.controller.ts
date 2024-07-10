import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import { PaymentMethod } from 'src/payment/domain/enum/payment-method.enum';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { PaymentDto } from '../dto/request/payment.dto';
import { PaymentResultDto } from '../dto/response/payment-result.dto';
@ApiTags('결제 관련 API')
@Controller('/api/v1/payments')
export class PaymentController {
  @Post('/')
  @ApiOperation({
    summary: '결제',
    description: '사용자가 주문한 상품을 결제합니다.',
  })
  @ApiSwaggerResponse(200, '결제 성공', PaymentResultDto)
  async order(
    @Body() dto: PaymentDto,
  ): Promise<ApiResponseDto<PaymentResultDto>> {
    const mockPayment = new PaymentResultDto(
      1,
      1,
      dto.orderId,
      dto.amount,
      PaymentStatus.COMPLETED,
      PaymentMethod.CARD,
      new Date(),
    );
    return new ApiResponseDto<PaymentResultDto>(true, '결제 성공', mockPayment);
  }
}
