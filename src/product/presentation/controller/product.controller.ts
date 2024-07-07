import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import {
  IBrowseProductsUseCase,
  IBrowseProductsUseCaseToken,
} from 'src/product/domain/interface/usecase/browse-products.usecase.interface';
import { ProductDto } from '../dto/response/product.dto';

@ApiTags('상품 관련 API')
@Controller('/api/v1/products')
export class ProductController {
  constructor(
    @Inject(IBrowseProductsUseCaseToken)
    private readonly browseProductsUseCase: IBrowseProductsUseCase,
  ) {}

  @Get('/all')
  @ApiSwaggerResponse(200, '전체 상품 목록 조회 성공', [ProductDto])
  async getAllProducts(): Promise<ApiResponseDto<ProductDto[]>> {
    return new ApiResponseDto(
      true,
      '전체 상품 목록 조회 성공',
      await this.browseProductsUseCase.execute(),
    );
  }

  @Get('/:productId')
  @ApiSwaggerResponse(200, '특정 상품 조회 성공', ProductDto)
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

  @Get('/popular')
  @ApiSwaggerResponse(200, '인기 상품 목록 조회 성공', [ProductDto])
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
