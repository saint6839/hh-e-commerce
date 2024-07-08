import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  @ApiSwaggerResponse(200, '장바구니 조회 성공', [CartDto])
  async browse(
    @Param('userId') userId: number,
  ): Promise<ApiResponseDto<CartDto[]>> {
    return new ApiResponseDto<CartDto[]>(true, '장바구니 조회 성공', []);
  }
}
