export class OrderResultDto {
  readonly totalPrice: number;

  constructor(totalPrice: number) {
    this.totalPrice = totalPrice;
  }
}
