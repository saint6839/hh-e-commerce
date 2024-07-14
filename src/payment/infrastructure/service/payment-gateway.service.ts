import { Injectable } from '@nestjs/common';
import { IPaymentGatewayService } from 'src/payment/domain/interface/service/payment-gateway.service.interface';

@Injectable()
export class PaymentGatewayService implements IPaymentGatewayService {
  /**
   * tid와 mid로 사용자의 결제 서버 결제 정보를 가져오는 상황을 mocking 하는 함수입니다.
   * 실제 결제서버는 없기 때문에, 명세만 남겨두었습니다.
   * @param mid
   * @param tid
   * @returns
   */
  async getPaidInfo(mid: string, tid: string): Promise<any> {
    // 외부 결제 서버로 mid와 tid를 전송하고 결제 정보를 받아와서 반환함
    return;
  }
}
