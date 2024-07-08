import { Inject, Injectable } from '@nestjs/common';
import { ProductOption } from 'src/product/domain/entity/product-option';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from 'src/product/domain/interface/repository/product-option.repository.interface';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from 'src/product/infrastructure/entity/product-option.entity';
import { DataSource, EntityManager } from 'typeorm';
import {
  ICartRepository,
  ICartRepositoryToken,
} from '../domain/interface/repository/cart.repository.interface';
import { IBrowseCartUseCase } from '../domain/interface/usecase/browse-cart.usecase.interface';
import { CartDto } from '../presentation/dto/response/cart.dto';

@Injectable()
export class BrowseCartUseCase implements IBrowseCartUseCase {
  constructor(
    @Inject(ICartRepositoryToken)
    private readonly cartRepository: ICartRepository,
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: number,
    entityManager?: EntityManager,
  ): Promise<CartDto[]> {
    const transactionCallback = async (entityManager: EntityManager) => {
      const cartEntities = await this.cartRepository.findByUserId(
        userId,
        entityManager,
      );

      if (cartEntities.length === 0) {
        return [];
      }

      const productOptionIds = cartEntities.map((cart) => cart.productOptionId);
      const productOptions = await this.productOptionRepository.findByIds(
        productOptionIds,
        entityManager,
      );

      const productOptionMap = new Map(
        productOptions.map((option) => [
          option.id,
          ProductOption.fromEntity(option),
        ]),
      );

      return cartEntities.map((cartEntity) => {
        const productOption = productOptionMap.get(cartEntity.productOptionId);
        if (!productOption) {
          throw new Error(
            `${NOT_FOUND_PRODUCT_OPTION_ERROR}: ${cartEntity.productOptionId}`,
          );
        }
        return new CartDto(
          cartEntity.id,
          productOption.toDto(),
          cartEntity.quantity,
        );
      });
    };

    if (entityManager) {
      return transactionCallback(entityManager);
    } else {
      return this.dataSource.transaction(transactionCallback);
    }
  }
}
