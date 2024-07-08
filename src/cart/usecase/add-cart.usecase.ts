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
import { IAddCartUseCase } from '../domain/interface/usecase/add-cart.usecase.interface';
import { CartEntity } from '../infrastructure/entity/cart.entity';
import { AddCartProductDetailDto } from '../presentation/dto/request/add-cart-product-detail.dto';
import { CartDto } from '../presentation/dto/response/cart.dto';

@Injectable()
export class AddCartUseCase implements IAddCartUseCase {
  constructor(
    @Inject(IProductOptionRepositoryToken)
    private readonly productOptionRepository: IProductOptionRepository,
    @Inject(ICartRepositoryToken)
    private readonly cartRepository: ICartRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    dto: AddCartProductDetailDto,
    entityManager?: EntityManager,
  ): Promise<CartDto> {
    const transactionCallback = async (
      transactionalEntityManager: EntityManager,
    ) => {
      const productOptionEntity = await this.productOptionRepository.findById(
        dto.productOptionId,
        transactionalEntityManager,
      );

      if (!productOptionEntity) {
        throw new Error(
          NOT_FOUND_PRODUCT_OPTION_ERROR + ': ' + dto.productOptionId,
        );
      }
      const productOption: ProductOption =
        ProductOption.fromEntity(productOptionEntity);
      const productOptionDto = productOption.toDto();

      const createdCartEntity = await this.cartRepository.create(
        CartEntity.of(dto.userId, productOptionEntity.id, dto.quantity),
        transactionalEntityManager,
      );

      return new CartDto(
        createdCartEntity.id,
        productOptionDto,
        createdCartEntity.quantity,
      );
    };

    if (entityManager) {
      return await transactionCallback(entityManager);
    } else {
      return await this.dataSource.transaction(transactionCallback);
    }
  }
}
