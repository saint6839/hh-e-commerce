import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/api/api-response.dto';
import { ApiSwaggerResponse } from 'src/common/swagger/api-response.decorator';
import {
  IBrowsePopularProductsFacadeUseCase,
  IBrowsePopularProductsFacadeUseCaseToken,
} from 'src/product/domain/interface/usecase/browse-popular-products-facade.usecase.interface';
import {
  IBrowseProductsUseCase,
  IBrowseProductsUseCaseToken,
} from 'src/product/domain/interface/usecase/browse-products.usecase.interface';
import {
  IReadProductUseCase,
  IReadProductUseCaseToken,
} from 'src/product/domain/interface/usecase/read-product.usecase.interface';
import { BrowsePopularProductsFacadeDto } from '../dto/request/browse-popular-products-facade.dto';
import { ProductDto } from '../dto/response/product.dto';

@ApiTags('상품 관련 API')
@Controller('/api/v1/products')
export class ProductController {
  constructor(
    @Inject(IBrowseProductsUseCaseToken)
    private readonly browseProductsUseCase: IBrowseProductsUseCase,
    @Inject(IReadProductUseCaseToken)
    private readonly readProductUseCase: IReadProductUseCase,
    @Inject(IBrowsePopularProductsFacadeUseCaseToken)
    private readonly browsePopularProductsFacadeUseCase: IBrowsePopularProductsFacadeUseCase,
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
  async getPopularProducts(
    @Query() browsePopularProductsFacadeDto: BrowsePopularProductsFacadeDto,
  ): Promise<ApiResponseDto<ProductDto[]>> {
    return new ApiResponseDto(
      true,
      '인기 상품 목록 조회 성공',
      await this.browsePopularProductsFacadeUseCase.execute(
        browsePopularProductsFacadeDto,
      ),
    );
  }
}
