import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { ChargeUserDto } from 'src/user/presentation/dto/request/charge-balance.dto';
import { UserDto } from 'src/user/presentation/dto/response/user.dto';

export const IChargeUserUsecaseToken = Symbol('IChargeUserUsecase');

export interface IChargeUserUsecase extends IUseCase<ChargeUserDto, UserDto> {}
