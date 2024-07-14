import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { PaymentDto } from 'src/payment/presentation/dto/request/payment.dto';
import { PaymentResultDto } from 'src/payment/presentation/dto/response/payment-result.dto';

export const ICreatePaymentUseCaseToken = Symbol('ICreatePaymentUseCase');

export interface ICreatePaymentUseCase
  extends IUseCase<PaymentDto, PaymentResultDto> {}
