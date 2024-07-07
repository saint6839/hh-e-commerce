import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import { PaymentStatus } from 'src/payment/domain/enum/payment-status.enum';
import { PaymentDto } from '../dto/request/payment.dto';
import { PaymentResultDto } from '../dto/response/payment-result.dto';
@ApiTags('결제 관련 API')
@Controller('/api/v1/payments')
export class PaymentController {
  @Post('/')
  @ApiSwaggerResponse(200, '결제 성공', PaymentResultDto)
  async order(
    @Body() dto: PaymentDto,
  ): Promise<ApiResponseDto<PaymentResultDto>> {
    const mockPayment = new PaymentResultDto(
      1,
      dto.orderId,
      dto.amount,
      PaymentStatus.COMPLETED,
      new Date(),
    );
    return new ApiResponseDto<PaymentResultDto>(true, '결제 성공', mockPayment);
  }
}
