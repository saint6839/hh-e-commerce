export class PaymentCompletedEvent {
  constructor(
    public readonly paymentId: number,
    public readonly orderId: number,
    public readonly userId: number,
    public readonly amount: number,
    public readonly status: string,
  ) {}
}
