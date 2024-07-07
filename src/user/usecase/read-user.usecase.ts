import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/entity/user';
import {
  IUserRepository,
  IUserRepositoryToken,
} from '../domain/interface/repository/user.repository.interface';
import { IReadUserUsecase } from '../domain/interface/usecase/read-user.usecase.interface';
import { UserDto } from '../presentation/dto/response/user.dto';

export const NOT_FOUND_USER_ERROR = '존재하지 않는 사용자입니다.';

@Injectable()
export class ReadUserUseCase implements IReadUserUsecase {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * userId를 통해 사용자 정보(잔액)을 조회하는 usecase
   * @param userId
   * @returns
   */
  async execute(userId: number): Promise<UserDto> {
    const userEntity = await this.userRepository.findById(userId);
    if (!userEntity) {
      throw new Error(NOT_FOUND_USER_ERROR);
    }
    const user = User.fromEntity(userEntity);
    return user.toDto();
  }
}
