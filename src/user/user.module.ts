import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IUserRepositoryToken } from './domain/interface/repository/user.repository.interface';
import { IReadUserUsecaseToken } from './domain/interface/usecase/read-user.usecase.interface';
import { UserEntity } from './infrastructure/entity/user.entity';
import { UserRepository } from './infrastructure/repository/user.repository';
import { UserController } from './presentation/controller/user.controller';
import { ReadUserUseCase } from './usecase/read-user.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [
    {
      provide: IUserRepositoryToken,
      useClass: UserRepository,
    },
    {
      provide: IReadUserUsecaseToken,
      useClass: ReadUserUseCase,
    },
  ],
})
export class UserModule {}
