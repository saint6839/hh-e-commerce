import { IUseCase } from 'src/common/interface/usecase/usecase.interface';
import { UserDto } from 'src/user/presentation/dto/response/user.dto';

export const IReadUserUsecaseToken = Symbol('IReadUserUsecase');

export interface IReadUserUsecase extends IUseCase<number, UserDto> {}
