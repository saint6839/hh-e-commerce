import { Injectable } from '@nestjs/common';
import { IPaymentGatewayService } from 'src/payment/domain/interface/service/payment-gateway.service.interface';

@Injectable()
export class PaymentGatewayService implements IPaymentGatewayService {
  async getPaidInfo(mid: string, tid: string): Promise<any> {
    // 외부 결제 서버로 mid와 tid를 전송하고 결제 정보를 받아와서 반환함
    return;
  }
}
