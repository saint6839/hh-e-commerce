import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import {
  IBrowseProductsUseCase,
  IBrowseProductsUseCaseToken,
} from 'src/product/domain/interface/usecase/browse-products.usecase.interface';
import {
  IReadProductUseCase,
  IReadProductUseCaseToken,
} from 'src/product/domain/interface/usecase/read-product.usecase.interface';
import { ProductOptionDto } from '../dto/response/product-option.dto';
import { ProductDto } from '../dto/response/product.dto';

@ApiTags('상품 관련 API')
@Controller('/api/v1/products')
export class ProductController {
  constructor(
    @Inject(IBrowseProductsUseCaseToken)
    private readonly browseProductsUseCase: IBrowseProductsUseCase,
    @Inject(IReadProductUseCaseToken)
    private readonly readProductUseCase: IReadProductUseCase,
  ) {}

  @Get('/all')
  @ApiOperation({
    summary: '전체 상품 목록 조회',
    description: '전체 상품 목록을 조회합니다.',
  })
  @ApiSwaggerResponse(200, '전체 상품 목록 조회 성공', [ProductDto])
  async getAllProducts(): Promise<ApiResponseDto<ProductDto[]>> {
    return new ApiResponseDto(
      true,
      '전체 상품 목록 조회 성공',
      await this.browseProductsUseCase.execute(),
    );
  }

  @Get('/:productId')
  @ApiOperation({
    summary: '특정 상품 조회',
    description: '특정 상품을 조회합니다.',
  })
  @ApiSwaggerResponse(200, '특정 상품 조회 성공', ProductDto)
  async getProduct(
    @Param('productId') productId: number,
  ): Promise<ApiResponseDto<ProductDto>> {
    return new ApiResponseDto(
      true,
      '특정 상품 조회 성공',
      await this.readProductUseCase.execute(productId),
    );
  }

  @Get('/popular')
  @ApiOperation({
    summary: '인기 상품 목록 조회',
    description: '인기 상품 목록을 조회합니다.',
  })
  @ApiSwaggerResponse(200, '인기 상품 목록 조회 성공', [ProductDto])
  async getPopularProducts(): Promise<ApiResponseDto<ProductDto[]>> {
    const mockPopularProducts = [
      new ProductDto(
        1,
        '상품 1',
        [new ProductOptionDto(1, '옵션 1', 10000, 100, 1)],
        ProductStatus.ACTIVATE,
      ),
      new ProductDto(
        2,
        '상품 2',
        [new ProductOptionDto(2, '옵션 2', 20000, 200, 2)],
        ProductStatus.ACTIVATE,
      ),
      new ProductDto(
        3,
        '상품 3',
        [new ProductOptionDto(3, '옵션 3', 30000, 300, 3)],
        ProductStatus.ACTIVATE,
      ),
    ];
    return new ApiResponseDto(
      true,
      '인기 상품 목록 조회 성공',
      mockPopularProducts,
    );
  }
}
