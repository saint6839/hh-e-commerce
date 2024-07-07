import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import { ChargeBalanceDto } from '../dto/request/charge-balance.dto';
import { UserDto } from '../dto/response/user.dto';

@ApiTags('사용자 관련 API')
@Controller('/api/v1/users')
export class UserController {
  @Post('/balance')
  @ApiSwaggerResponse(200, '사용자 잔액 충전 성공', UserDto)
  async charge(
    @Body() dto: ChargeBalanceDto,
  ): Promise<ApiResponseDto<UserDto>> {
    const mockUser = new UserDto(dto.userId, '채상엽', dto.amount + 1000);
    return new ApiResponseDto<UserDto>(true, '사용자 잔액 충전 성공', mockUser);
  }

  @Get('/:userId')
  @ApiSwaggerResponse(200, '사용자 잔액(정보) 조회 성공', UserDto)
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
