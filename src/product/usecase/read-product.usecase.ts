import { Inject, Injectable } from '@nestjs/common';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from '../domain/interface/repository/product-option.repository.interface';
import {
  IProductRepository,
  IProductRepositoryToken,
} from '../domain/interface/repository/product.repository.interface';
import { IReadProductUseCase } from '../domain/interface/usecase/read-product.usecase.interface';
import { NOT_FOUND_PRODUCT_ERROR } from '../infrastructure/entity/product.entity';
import { ProductOptionDto } from '../presentation/dto/response/product-option.dto';
import { ProductDto } from '../presentation/dto/response/product.dto';

@Injectable()
export class ReadProductUseCase implements IReadProductUseCase {
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
  ) {}

  /**
   * 특정 상품을 조회하는 usecase
   * @param productId
   * @returns
   */
  async execute(productId: number): Promise<ProductDto> {
    const productEntity = await this.productRepository.findById(productId);
    if (!productEntity)
      throw new Error(NOT_FOUND_PRODUCT_ERROR + ': ' + productId);

    const productOptionEntities =
      await this.productOptionRepository.findByProductId(productId);

    return new ProductDto(
      productEntity.id,
      productEntity.name,
      productOptionEntities.map(
        (productOptionEntity) =>
          new ProductOptionDto(
            productOptionEntity.id,
            productOptionEntity.name,
            productOptionEntity.price,
            productOptionEntity.stock,
            productOptionEntity.productId,
          ),
      ),
      productEntity.status,
    );
  }
}
