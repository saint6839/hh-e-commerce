import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import {
  IChargeUserUsecase,
  IChargeUserUsecaseToken,
} from 'src/user/domain/interface/usecase/charge-user.usecase.interface';
import {
  IReadUserUsecase,
  IReadUserUsecaseToken,
} from 'src/user/domain/interface/usecase/read-user.usecase.interface';
import { ChargeUserDto } from '../dto/request/charge-balance.dto';
import { UserDto } from '../dto/response/user.dto';

@ApiTags('사용자 관련 API')
@Controller('/api/v1/users')
export class UserController {
  constructor(
    @Inject(IReadUserUsecaseToken)
    private readonly readUserUsecase: IReadUserUsecase,
    @Inject(IChargeUserUsecaseToken)
    private readonly chargeUserUsecase: IChargeUserUsecase,
  ) {}

  @Post('/balance')
  @ApiSwaggerResponse(200, '사용자 잔액 충전 성공', UserDto)
  async charge(@Body() dto: ChargeUserDto): Promise<ApiResponseDto<UserDto>> {
    return new ApiResponseDto<UserDto>(
      true,
      '사용자 잔액 충전 성공',
      await this.chargeUserUsecase.execute(dto),
    );
  }

  @Get('/:userId')
  @ApiSwaggerResponse(200, '사용자 잔액(정보) 조회 성공', UserDto)
  async getUserBalance(
    @Param('userId') userId: number,
  ): Promise<ApiResponseDto<UserDto>> {
    return new ApiResponseDto<UserDto>(
      true,
      '사용자 잔액(정보) 조회 성공',
      await this.readUserUsecase.execute(userId),
    );
  }
}
