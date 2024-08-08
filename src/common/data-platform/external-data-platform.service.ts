import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalDataPlatformService {
  constructor() {}

  async saveOrderData({
    orderId,
    userId,
    amount,
    status,
  }: {
    orderId: number;
    userId: number;
    amount: number;
    status: string;
  }): Promise<void> {
    // 외부 데이터 플랫폼에 주문 정보 저장 로직!
    return;
  }
}
