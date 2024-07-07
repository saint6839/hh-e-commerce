import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../domain/entity/product';
import {
  IProductRepository,
  IProductRepositoryToken,
} from '../domain/interface/repository/product.repository.interface';
import { IBrowseProductsUseCase } from '../domain/interface/usecase/browse-products.usecase.interface';
import { ProductDto } from '../presentation/dto/response/product.dto';

@Injectable()
export class BrowseProductsUseCase implements IBrowseProductsUseCase {
  constructor(
    @Inject(IProductRepositoryToken)
    private readonly productRepository: IProductRepository,
  ) {}

  /**
   * 전체 상품 목록을 조회하는 usecase
   * @returns
   */
  async execute(): Promise<ProductDto[]> {
    const productEntities = await this.productRepository.findAll();
    return productEntities.map((productEntity) => {
      return Product.fromEntity(productEntity).toDto();
    });
  }
}
