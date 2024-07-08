import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { IReadProductUseCaseToken } from 'src/product/domain/interface/usecase/read-product.usecase.interface';
import { ProductOptionEntity } from 'src/product/infrastructure/entity/product-option.entity';
import {
  NOT_FOUND_PRODUCT_ERROR,
  ProductEntity,
} from 'src/product/infrastructure/entity/product.entity';
import { ReadProductUseCase } from 'src/product/usecase/read-product.usecase';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('ReadProductUseCase (통합 테스트)', () => {
  let app: INestApplication;
  let readProductUseCase: ReadProductUseCase;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    readProductUseCase = moduleFixture.get<ReadProductUseCase>(
      IReadProductUseCaseToken,
    );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
  });

  beforeEach(async () => {
    await productOptionRepository.clear();
    await productRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('존재하는 상품 ID로 조회 시 해당 상품의 정보와 옵션이 반환되는지 테스트', async () => {
    // given
    const testProduct = await productRepository.save({
      name: '테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const testProductOptions = await productOptionRepository.save([
      { name: '옵션1', price: 1000, stock: 10, productId: testProduct.id },
      { name: '옵션2', price: 2000, stock: 20, productId: testProduct.id },
    ]);

    // when
    const result = await readProductUseCase.execute(testProduct.id);

    // then
    expect(result.id).toBe(testProduct.id);
    expect(result.name).toBe('테스트 상품');
    expect(result.status).toBe(ProductStatus.ACTIVATE);
    expect(result.productOptions).toHaveLength(2);
    expect(result.productOptions[0].name).toBe('옵션1');
    expect(result.productOptions[0].price).toBe(1000);
    expect(result.productOptions[0].stock).toBe(10);
    expect(result.productOptions[1].name).toBe('옵션2');
    expect(result.productOptions[1].price).toBe(2000);
    expect(result.productOptions[1].stock).toBe(20);
  });

  it('존재하지 않는 상품 ID로 조회 시 예외가 발생하는지 테스트', async () => {
    // when & then
    await expect(readProductUseCase.execute(999)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR + ': 999',
    );
  });

  it('삭제된 상품을 조회하려 할 때 예외가 발생하는지 테스트', async () => {
    // given
    const deletedProduct = await productRepository.save({
      name: '삭제된 상품',
      status: ProductStatus.ACTIVATE,
      deletedAt: new Date(),
    });

    // when & then
    await expect(readProductUseCase.execute(deletedProduct.id)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR + ': ' + deletedProduct.id,
    );
  });

  it('상품 옵션이 없는 상품 조회 시 빈 옵션 배열이 반환되는지 테스트', async () => {
    // given
    const testProduct = await productRepository.save({
      name: '옵션 없는 상품',
      status: ProductStatus.ACTIVATE,
    });

    // when
    const result = await readProductUseCase.execute(testProduct.id);

    // then
    expect(result.id).toBe(testProduct.id);
    expect(result.name).toBe('옵션 없는 상품');
    expect(result.status).toBe(ProductStatus.ACTIVATE);
    expect(result.productOptions).toHaveLength(0);
  });
});
