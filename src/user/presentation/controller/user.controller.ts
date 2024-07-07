import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ChargeBalanceDto } from '../dto/request/charge-balance.dto';
import { UserDto } from '../dto/response/user.dto';

@Controller('/api/v1/users')
export class UserController {
  @Post('/balance')
  async charge(
    @Body() dto: ChargeBalanceDto,
  ): Promise<ApiResponseDto<UserDto>> {
    const mockUser = new UserDto(dto.userId, '채상엽', dto.amount + 1000);
    return new ApiResponseDto<UserDto>(true, '사용자 잔액 충전 성공', mockUser);
  }

  @Get('/:userId')
  async getUserBalance(
    @Param('userId') userId: number,
  ): Promise<ApiResponseDto<UserDto>> {
    const mockUser = new UserDto(userId, '채상엽', 1000);
    return new ApiResponseDto<UserDto>(
      true,
      '사용자 잔액(정보) 조회 성공',
      mockUser,
    );
  }
}
