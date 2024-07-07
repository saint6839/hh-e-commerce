import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { UserDto } from 'src/user/presentation/dto/response/user.dto';

export const INVALID_CHARGE_AMOUNT_ERROR = '충전 금액은 0보다 커야 합니다.';

export class User {
  private _id: number;
  private _name: string;
  private _balance: number;

  constructor(id: number, name: string, balance: number) {
    this._id = id;
    this._name = name;
    this._balance = balance;
  }

  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get balance(): number {
    return this._balance;
  }

  public charge(amount: number): User {
    if (amount <= 0) {
      throw new Error(INVALID_CHARGE_AMOUNT_ERROR);
    }
    this._balance += amount;
    return this;
  }

  static fromEntity(entity: UserEntity): User {
    return new User(entity.id, entity.name, entity.balance);
  }

  toEntity(): UserEntity {
    const entity = new UserEntity();
    entity.id = this._id;
    entity.name = this._name;
    entity.balance = this._balance;
    return entity;
  }

  toDto(): UserDto {
    return new UserDto(this._id, this._name, this._balance);
  }

  static fromDto(dto: UserDto): User {
    return new User(dto.id, dto.name, dto.balance);
  }
}
