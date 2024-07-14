export const IPaymentGatewayServiceToken = Symbol('IPaymentGatewayService');

export interface IPaymentGatewayService {
  getPaidInfo(mid: string, tid: string): Promise<any>;
}
