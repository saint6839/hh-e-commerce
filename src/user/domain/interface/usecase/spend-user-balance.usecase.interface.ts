import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { SpendBalanceDto } from 'src/user/presentation/dto/request/spend-balance.dto';
import { UserDto } from 'src/user/presentation/dto/response/user.dto';

export const ISpendUserBalanceUsecaseToken = Symbol('ISpendUserBalanceUsecase');

export interface ISpendUserBalanceUsecase
  extends IUseCase<SpendBalanceDto, UserDto> {}
