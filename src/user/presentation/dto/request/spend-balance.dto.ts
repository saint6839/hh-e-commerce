export class SpendBalanceDto {
  readonly userId: number;
  readonly amount: number;

  constructor(userId: number, amount: number) {
    this.userId = userId;
    this.amount = amount;
  }
}
