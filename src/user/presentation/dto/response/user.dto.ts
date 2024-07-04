export class UserDto {
  readonly id: number;
  readonly name: string;
  readonly balance: number;

  constructor(id: number, name: string, balance: number) {
    this.id = id;
    this.name = name;
    this.balance = balance;
  }
}
