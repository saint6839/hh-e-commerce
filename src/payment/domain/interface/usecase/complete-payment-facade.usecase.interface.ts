import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { CompletePaymentFacadeDto } from 'src/payment/presentation/dto/request/complete-payment-facade.dto';
import { PaymentResultDto } from 'src/payment/presentation/dto/response/payment-result.dto';

export const ICompletePaymentFacadeUseCaseToken = Symbol(
  'ICompletePaymentFacadeUseCase',
);

export interface ICompletePaymentFacadeUseCase
  extends IUseCase<CompletePaymentFacadeDto, PaymentResultDto> {}
