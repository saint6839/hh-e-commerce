import { Inject, Injectable } from '@nestjs/common';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from '../domain/interface/repository/product-option.repository.interface';
import {
  IProductRepository,
  IProductRepositoryToken,
} from '../domain/interface/repository/product.repository.interface';
import { IBrowseProductsUseCase } from '../domain/interface/usecase/browse-products.usecase.interface';
import { ProductOptionDto } from '../presentation/dto/response/product-option.dto';
import { ProductDto } from '../presentation/dto/response/product.dto';

@Injectable()
export class BrowseProductsUseCase implements IBrowseProductsUseCase {
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
  ) {}

  /**
   * 전체 상품 목록을 조회하는 usecase
   * @returns
   */
  async execute(): Promise<ProductDto[]> {
    const productEntities = await this.productRepository.findAll();

    const productDtosPromises = productEntities.map(async (productEntity) => {
      const productOptionEntities =
        await this.productOptionRepository.findByProductId(productEntity.id);

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
    });

    return Promise.all(productDtosPromises);
  }
}
