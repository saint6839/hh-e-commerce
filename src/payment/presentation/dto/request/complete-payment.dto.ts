export class CompletePaymentDto {
  readonly paymentId: number;
  readonly mid: string;
  readonly tid: string;

  constructor(paymentId: number, mid: string, tid: string) {
    this.paymentId = paymentId;
    this.mid = mid;
    this.tid = tid;
  }
}
