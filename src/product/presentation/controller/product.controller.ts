import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ProductDto } from '../dto/response/product.dto';

@Controller('/api/v1/products')
export class ProductController {
  @Get('/:productId')
  async getProduct(
    @Param('productId') productId: number,
  ): Promise<ApiResponseDto<ProductDto>> {
    const mockProduct = new ProductDto(
      productId,
      '상품 ' + productId,
      10000,
      100,
    );
    return new ApiResponseDto(true, '특정 상품 조회 성공', mockProduct);
  }

  @Get('/all')
  async getAllProducts(): Promise<ApiResponseDto<ProductDto[]>> {
    const mockProducts = [
      new ProductDto(1, '상품 1', 10000, 100),
      new ProductDto(2, '상품 2', 20000, 200),
      new ProductDto(3, '상품 3', 30000, 300),
    ];
    return new ApiResponseDto(true, '전체 상품 목록 조회 성공', mockProducts);
  }

  @Get('/popular')
  async getPopularProducts(): Promise<ApiResponseDto<ProductDto[]>> {
    const mockPopularProducts = [
      new ProductDto(1, '인기 상품 1', 15000, 40),
      new ProductDto(2, '인기 상품 2', 25000, 30),
      new ProductDto(3, '인기 상품 3', 35000, 20),
    ];
    return new ApiResponseDto(
      true,
      '인기 상품 목록 조회 성공',
      mockPopularProducts,
    );
  }
}
