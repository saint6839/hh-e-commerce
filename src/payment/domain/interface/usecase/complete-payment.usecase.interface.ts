import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { CompletePaymentDto } from 'src/payment/presentation/dto/request/complete-payment.dto';
import { PaymentResultDto } from 'src/payment/presentation/dto/response/payment-result.dto';

export const ICompletePaymentUseCaseToken = Symbol('ICompletePaymentUseCase');

export interface ICompletePaymentUseCase
  extends IUseCase<CompletePaymentDto, PaymentResultDto> {}
