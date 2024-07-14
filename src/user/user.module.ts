import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IUserRepositoryToken } from './domain/interface/repository/user.repository.interface';
import { IChargeUserUsecaseToken } from './domain/interface/usecase/charge-user.usecase.interface';
import { IReadUserUsecaseToken } from './domain/interface/usecase/read-user.usecase.interface';
import { ISpendUserBalanceUsecaseToken } from './domain/interface/usecase/spend-user-balance.usecase.interface';
import { UserEntity } from './infrastructure/entity/user.entity';
import { UserRepository } from './infrastructure/repository/user.repository';
import { UserController } from './presentation/controller/user.controller';
import { ChargeUserUseCase } from './usecase/charge-user.usecase';
import { ReadUserUseCase } from './usecase/read-user.usecase';
import { SpendUserBalanceUseCase } from './usecase/spend-user-balance.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  exports: [ISpendUserBalanceUsecaseToken],
  providers: [
    {
      provide: IUserRepositoryToken,
      useClass: UserRepository,
    },
    {
      provide: IReadUserUsecaseToken,
      useClass: ReadUserUseCase,
    },
    {
      provide: IChargeUserUsecaseToken,
      useClass: ChargeUserUseCase,
    },
    {
      provide: ISpendUserBalanceUsecaseToken,
      useClass: SpendUserBalanceUseCase,
    },
  ],
})
export class UserModule {}
