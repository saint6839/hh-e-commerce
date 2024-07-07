import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/entity/user';
import {
  IUserRepository,
  IUserRepositoryToken,
} from '../domain/interface/repository/user.repository.interface';
import { IChargeUserUsecase } from '../domain/interface/usecase/charge-user.usecase.interface';
import { NOT_FOUND_USER_ERROR } from '../infrastructure/entity/user.entity';
import { ChargeUserDto } from '../presentation/dto/request/charge-balance.dto';
import { UserDto } from '../presentation/dto/response/user.dto';

@Injectable()
export class ChargeUserUseCase implements IChargeUserUsecase {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ChargeUserDto): Promise<UserDto> {
    const entity = await this.userRepository.findById(input.userId);
    if (!entity) {
      throw new Error(NOT_FOUND_USER_ERROR);
    }
    const user = User.fromEntity(entity).charge(input.amount);
    const chargedUserEntity = await this.userRepository.update(user.toEntity());
    const chargedUser = User.fromEntity(chargedUserEntity);
    return chargedUser.toDto();
  }
}