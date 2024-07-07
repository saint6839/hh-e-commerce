import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../domain/entity/product';
import {
  IProductRepository,
  IProductRepositoryToken,
} from '../domain/interface/repository/product.repository.interface';
import { IReadProductUseCase } from '../domain/interface/usecase/read-product.usecase.interface';
import { NOT_FOUND_PRODUCT_ERROR } from '../infrastructure/entity/product.entity';
import { ProductDto } from '../presentation/dto/response/product.dto';

@Injectable()
export class ReadProductUseCase implements IReadProductUseCase {
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
  ) {}

  /**
   * 특정 상품을 조회하는 usecase
   * @param productId
   * @returns
   */
  async execute(productId: number): Promise<ProductDto> {
    const productEntity = await this.productRepository.findById(productId);
    if (!productEntity) {
      throw new Error(NOT_FOUND_PRODUCT_ERROR);
    }
    const product = Product.fromEntity(productEntity);
    return product.toDto();
  }
}
