import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IAddCartUseCase,
  IAddCartUseCaseToken,
} from 'src/cart/domain/interface/usecase/add-cart.usecase.interface';
import {
  IDeleteCartUsecase,
  IDeleteCartUsecaseToken,
} from 'src/cart/domain/interface/usecase/delete-cart.usecase.interface';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import { AddCartProductDetailDto } from '../dto/request/add-cart-product-detail.dto';
import { CartDto } from '../dto/response/cart.dto';

@ApiTags('장바구니 관련 API')
@Controller('/api/v1/carts')
export class CartController {
  constructor(
    @Inject(IAddCartUseCaseToken)
    private readonly addCartUseCase: IAddCartUseCase,
    @Inject(IDeleteCartUsecaseToken)
    private readonly deleteCartUseCase: IDeleteCartUsecase,
  ) {}

  @Post()
  @ApiOperation({
    summary: '장바구니에 상품 추가',
    description: '사용자가 선택한 상품을 장바구니에 추가합니다.',
  })
  @ApiSwaggerResponse(
    201,
    '상품이 장바구니에 성공적으로 추가되었습니다.',
    CartDto,
  )
  async addProduct(
    @Body() dto: AddCartProductDetailDto,
  ): Promise<ApiResponseDto<CartDto>> {
    return new ApiResponseDto<CartDto>(
      true,
      '상품이 장바구니에 성공적으로 추가되었습니다.',
      await this.addCartUseCase.execute(dto),
    );
  }

  @Delete('/:cartId')
  @ApiOperation({
    summary: '장바구니에서 상품 삭제',
    description: '장바구니에서 특정 상품을 삭제합니다.',
  })
  @ApiSwaggerResponse(204, '상품이 장바구니에서 성공적으로 삭제되었습니다.')
  async deleteProduct(
    @Param('cartId') cartId: number,
  ): Promise<ApiResponseDto<void>> {
    return new ApiResponseDto<void>(
      true,
      '상품이 장바구니에서 성공적으로 삭제되었습니다.',
      await this.deleteCartUseCase.execute(cartId),
    );
  }

  @Get('/:userId')
  @ApiOperation({
    summary: '사용자의 장바구니 조회',
    description: '특정 사용자의 장바구니 내용을 조회합니다.',
  })
  @ApiSwaggerResponse(200, '장바구니 조회 성공', [CartDto])
  async browse(
    @Param('userId') userId: number,
  ): Promise<ApiResponseDto<CartDto[]>> {
    return new ApiResponseDto<CartDto[]>(true, '장바구니 조회 성공', []);
  }
}
