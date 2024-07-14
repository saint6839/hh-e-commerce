import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { IDecreaseProductStockUsecaseToken } from 'src/product/domain/interface/usecase/decrease-product-stock.usecase.interface';
import {
  NOT_FOUND_PRODUCT_OPTION_ERROR,
  ProductOptionEntity,
} from 'src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { DecreaseProductStockDto } from 'src/product/presentation/dto/request/decrease-product-stock.dto';
import { DecreaseProductStockUseCase } from 'src/product/usecase/decrease-product-stock.usecase';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('DecreaseProductStockUseCase (통합 테스트)', () => {
  let app: INestApplication;
  let decreaseProductStockUseCase: DecreaseProductStockUseCase;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    decreaseProductStockUseCase =
      moduleFixture.get<DecreaseProductStockUseCase>(
        IDecreaseProductStockUsecaseToken,
      );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await productOptionRepository.clear();
    await productRepository.clear();
  });

  it('상품 옵션의 재고를 성공적으로 감소시키는지 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: '테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const productOption = await productOptionRepository.save({
      name: '테스트 옵션',
      price: 1000,
      stock: 10,
      productId: product.id,
    });

    const dto: DecreaseProductStockDto = {
      productOptionId: productOption.id,
      quantity: 3,
    };

    // when
    const result = await decreaseProductStockUseCase.execute(dto);

    // then
    expect(result).toBeDefined();
    expect(result.id).toBe(product.id);
    expect(result.name).toBe('테스트 상품');
    expect(result.productOptions).toHaveLength(1);
    expect(result.productOptions[0].id).toBe(productOption.id);
    expect(result.productOptions[0].stock).toBe(7);

    const updatedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });
    expect(updatedProductOption?.stock).toBe(7);
  });

  it('존재하지 않는 상품 옵션에 대해 예외를 발생시키는지 테스트', async () => {
    // given
    const dto: DecreaseProductStockDto = {
      productOptionId: 999,
      quantity: 1,
    };

    // when & then
    await expect(decreaseProductStockUseCase.execute(dto)).rejects.toThrow(
      `${NOT_FOUND_PRODUCT_OPTION_ERROR}: 999`,
    );
  });

  it('재고가 부족할 경우 예외를 발생시키는지 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: '테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const productOption = await productOptionRepository.save({
      name: '테스트 옵션',
      price: 1000,
      stock: 5,
      productId: product.id,
    });

    const dto: DecreaseProductStockDto = {
      productOptionId: productOption.id,
      quantity: 10,
    };

    // when & then
    await expect(decreaseProductStockUseCase.execute(dto)).rejects.toThrow(
      '재고가 부족합니다',
    );

    const unchangedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });
    expect(unchangedProductOption?.stock).toBe(5);
  });

  it('트랜잭션 내에서 실행될 때 정상 동작하는지 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: '테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const productOption = await productOptionRepository.save({
      name: '테스트 옵션',
      price: 1000,
      stock: 10,
      productId: product.id,
    });

    const dto: DecreaseProductStockDto = {
      productOptionId: productOption.id,
      quantity: 3,
    };

    // when
    await productRepository.manager.transaction(async (entityManager) => {
      await decreaseProductStockUseCase.execute(dto, entityManager);
    });

    // then
    const updatedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });
    expect(updatedProductOption?.stock).toBe(7);
  });
});
