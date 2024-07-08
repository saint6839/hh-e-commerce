import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IBrowseProductsUseCaseToken } from 'src/product/domain/interface/usecase/browse-products.usecase.interface';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../../../src/product/infrastructure/entity/product.entity';
import { BrowseProductsUseCase } from '../../../../src/product/usecase/browse-products.usecase';

describe('BrowseProductsUseCase (통합 테스트)', () => {
  let app: INestApplication;
  let browseProductsUseCase: BrowseProductsUseCase;
  let productRepository: Repository<ProductEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    browseProductsUseCase = moduleFixture.get<BrowseProductsUseCase>(
      IBrowseProductsUseCaseToken,
    );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
  });

  beforeEach(async () => {
    await productRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('저장되어 있는 상품이 모두 잘 조회되어야 한다.', async () => {
    //given
    const testProducts = [
      { name: '상품1', price: 1000, stock: 10 },
      { name: '상품2', price: 2000, stock: 20 },
    ];

    for (const product of testProducts) {
      await productRepository.save(product);
    }

    //when
    const result = await browseProductsUseCase.execute();

    //then
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('상품1');
    expect(result[0].price).toBe(1000);
    expect(result[0].stock).toBe(10);
    expect(result[1].name).toBe('상품2');
    expect(result[1].price).toBe(2000);
    expect(result[1].stock).toBe(20);
  });

  it('상품이 없을 경우 빈 배열을 반환해야 한다', async () => {
    const result = await browseProductsUseCase.execute();
    expect(result).toHaveLength(0);
  });

  it('삭제된 상품은 조회되지 않아야 한다', async () => {
    //given
    const activeProduct = await productRepository.save({
      name: '활성 상품',
      price: 1000,
      stock: 10,
    });

    await productRepository.save({
      name: '삭제된 상품',
      price: 2000,
      stock: 20,
      deletedAt: new Date(),
    });

    //when
    const result = await browseProductsUseCase.execute();

    //then
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe(activeProduct.name);
    expect(result[0].price).toBe(activeProduct.price);
    expect(result[0].stock).toBe(activeProduct.stock);
  });
});
