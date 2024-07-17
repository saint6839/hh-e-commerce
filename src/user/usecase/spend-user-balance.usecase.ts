import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../domain/entity/user';
import {
  IUserRepository,
  IUserRepositoryToken,
} from '../domain/interface/repository/user.repository.interface';
import { ISpendUserBalanceUsecase } from '../domain/interface/usecase/spend-user-balance.usecase.interface';
import { NOT_FOUND_USER_ERROR } from '../infrastructure/entity/user.entity';
import { SpendBalanceDto } from '../presentation/dto/request/spend-balance.dto';
import { UserDto } from '../presentation/dto/response/user.dto';

@Injectable()
export class SpendUserBalanceUseCase implements ISpendUserBalanceUsecase {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
    private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
  ) {}

  async execute(
    dto: SpendBalanceDto,
    entityManager?: EntityManager,
  ): Promise<UserDto> {
    const transactionCallback = async (entityManager: EntityManager) => {
      const entity = await this.userRepository.findById(
        dto.userId,
        entityManager,
      );
      if (!entity) {
        throw new Error(NOT_FOUND_USER_ERROR);
      }
      const user = User.fromEntity(entity);
      const updatedUser = user.spend(dto.amount);
      const updatedUserEntity = await this.userRepository.update(
        updatedUser.toEntity(),
        entityManager,
      );

      this.loggerService.log(
        `사용자 잔액 차감 완료 : UserID=${updatedUser.id}, Amount=${dto.amount}`,
      );
      return User.fromEntity(updatedUserEntity).toDto();
    };

    if (entityManager) {
      return transactionCallback(entityManager);
    }
    return this.dataSource.transaction(transactionCallback);
  }
}
