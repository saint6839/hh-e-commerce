import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { AddCartProductDto } from '../dto/request/add-cart-product.dto';
import { CartItemDto } from '../dto/response/cart-item.dto';
import { CartDto } from '../dto/response/cart.dto';

@ApiTags('장바구니 관련 API')
@Controller('/api/v1/carts')
export class CartController {
  @Post()
  @ApiSwaggerResponse(
    201,
    '상품이 장바구니에 성공적으로 추가되었습니다.',
    CartDto,
  )
  async addProduct(
    @Body() dto: AddCartProductDto,
  ): Promise<ApiResponseDto<CartDto>> {
    const mockCart = new CartDto(dto.userId, [
      new CartItemDto(
        new ProductDto(dto.product.productId, '상품 1', 10000, 100),
        1,
      ),
    ]);
    return new ApiResponseDto<CartDto>(
      true,
      '상품이 장바구니에 성공적으로 추가되었습니다.',
      mockCart,
    );
  }

  @Delete('/:userId/:productId')
  @ApiSwaggerResponse(204, '상품이 장바구니에서 성공적으로 삭제되었습니다.')
  async deleteProduct(
    @Param('userId') userId: number,
    @Param('productId') productId: number,
  ): Promise<ApiResponseDto<void>> {
    return new ApiResponseDto<void>(
      true,
      '상품이 장바구니에서 성공적으로 삭제되었습니다.',
    );
  }

  @Get('/:userId')
  @ApiSwaggerResponse(200, '장바구니 조회 성공', CartDto)
  async browse(
    @Param('userId') userId: number,
  ): Promise<ApiResponseDto<CartDto>> {
    const mockCart = new CartDto(userId, [
      new CartItemDto(new ProductDto(1, '상품 1', 10000, 100), 1),
      new CartItemDto(new ProductDto(2, '상품 2', 20000, 200), 2),
    ]);
    return new ApiResponseDto<CartDto>(true, '장바구니 조회 성공', mockCart);
  }
}
