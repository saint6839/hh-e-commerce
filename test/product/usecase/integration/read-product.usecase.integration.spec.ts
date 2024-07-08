import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IReadProductUseCaseToken } from 'src/product/domain/interface/usecase/read-product.usecase.interface';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';
import {
  NOT_FOUND_PRODUCT_ERROR,
  ProductEntity,
} from '../../../../src/product/infrastructure/entity/product.entity';
import { ReadProductUseCase } from '../../../../src/product/usecase/read-product.usecase';

describe('ReadProductUseCase (통합 테스트)', () => {
  let app: INestApplication;
  let readProductUseCase: ReadProductUseCase;
  let productRepository: Repository<ProductEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    readProductUseCase = moduleFixture.get<ReadProductUseCase>(
      IReadProductUseCaseToken,
    );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
  });

  beforeEach(async () => {
    await productRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('존재하는 상품 ID로 조회 시 해당 상품의 정보가 반환되는지 테스트', async () => {
    // given
    const testProduct = await productRepository.save({
      name: '테스트 상품',
      price: 1000,
      stock: 10,
    });

    // when
    const result = await readProductUseCase.execute(testProduct.id);

    // then
    expect(result.id).toBe(testProduct.id);
    expect(result.name).toBe('테스트 상품');
    expect(result.price).toBe(1000);
    expect(result.stock).toBe(10);
  });

  it('존재하지 않는 상품 ID로 조회 시 예외가 발생하는지 테스트', async () => {
    // when & then
    await expect(readProductUseCase.execute(999)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR,
    );
  });

  it('삭제된 상품을 조회하려 할 때 예외가 발생하는지 테스트', async () => {
    // given
    const deletedProduct = await productRepository.save({
      name: '삭제된 상품',
      price: 2000,
      stock: 20,
      deletedAt: new Date(),
    });

    // when & then
    await expect(readProductUseCase.execute(deletedProduct.id)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR,
    );
  });
});
