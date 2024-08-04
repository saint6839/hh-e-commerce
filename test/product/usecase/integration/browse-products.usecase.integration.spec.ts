import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CacheService } from 'src/common/redis/redis-cache.service';
import { IBrowseProductsUseCaseToken } from 'src/product/domain/interface/usecase/browse-products.usecase.interface';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';
import { ProductStatus } from '../../../../src/product/domain/enum/product-status.enum';
import { ProductOptionEntity } from '../../../../src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from '../../../../src/product/infrastructure/entity/product.entity';
import { BrowseProductsUseCase } from '../../../../src/product/usecase/browse-products.usecase';

describe('BrowseProductsUseCase (통합 테스트)', () => {
  let app: INestApplication;
  let browseProductsUseCase: BrowseProductsUseCase;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;
  let cacheService: CacheService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    browseProductsUseCase = moduleFixture.get<BrowseProductsUseCase>(
      IBrowseProductsUseCaseToken,
    );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
    cacheService = moduleFixture.get<CacheService>(CacheService);
    await productOptionRepository.clear();
    await productRepository.clear();
    await cacheService.flushall();
  });

  afterEach(async () => {
    await productOptionRepository.clear();
    await productRepository.clear();
    await cacheService.flushall();
  });

  afterAll(async () => {
    await app.close();
  });

  it('저장되어 있는 상품과 옵션이 모두 잘 조회되어야 하고, 캐시에 저장되어야 한다.', async () => {
    //given
    const testProducts = [
      {
        name: '상품1',
        status: ProductStatus.ACTIVATE,
        deletedAt: null,
      },
      {
        name: '상품2',
        status: ProductStatus.ACTIVATE,
        deletedAt: null,
      },
    ];

    const savedProducts: ProductEntity[] = [];
    for (const product of testProducts) {
      savedProducts.push(await productRepository.save(product));
    }

    const testOptions = [
      { name: '옵션1', price: 1000, stock: 10, productId: savedProducts[0].id },
      { name: '옵션2', price: 2000, stock: 20, productId: savedProducts[1].id },
    ];

    for (const option of testOptions) {
      await productOptionRepository.save(option);
    }

    //when
    const result = await browseProductsUseCase.execute();

    //then
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('상품1');
    expect(result[0].productOptions).toHaveLength(1);
    expect(result[0].productOptions[0].name).toBe('옵션1');
    expect(result[0].productOptions[0].price).toBe(1000);
    expect(result[0].productOptions[0].stock).toBe(10);
    expect(result[1].name).toBe('상품2');
    expect(result[1].productOptions).toHaveLength(1);
    expect(result[1].productOptions[0].name).toBe('옵션2');
    expect(result[1].productOptions[0].price).toBe(2000);
    expect(result[1].productOptions[0].stock).toBe(20);

    // 캐시 확인
    const cachedResult = await cacheService.get('all_products1');
    expect(cachedResult).toBeTruthy();
    if (cachedResult) {
      expect(JSON.parse(cachedResult)).toEqual(result);
    }
  });

  it('상품이 없을 경우 빈 배열을 반환하고, 캐시에 빈 배열이 저장되어야 한다', async () => {
    const result = await browseProductsUseCase.execute();
    expect(result).toHaveLength(0);

    // 캐시 확인
    const cachedResult = await cacheService.get('all_products1');
    expect(cachedResult).toBeTruthy();
    if (cachedResult) {
      expect(JSON.parse(cachedResult)).toEqual(result);
    }
  });

  it('삭제된 상품은 조회되지 않아야 하고, 캐시에도 저장되지 않아야 한다', async () => {
    //given
    const activeProduct = await productRepository.save({
      name: '활성 상품',
      status: ProductStatus.ACTIVATE,
    });

    await productRepository.save({
      name: '삭제된 상품',
      status: ProductStatus.ACTIVATE,
      deletedAt: new Date(),
    });

    await productOptionRepository.save({
      name: '활성 상품 옵션',
      price: 1000,
      stock: 10,
      productId: activeProduct.id,
    });

    //when
    const result = await browseProductsUseCase.execute();

    //then
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe(activeProduct.name);
    expect(result[0].productOptions).toHaveLength(1);
    expect(result[0].productOptions[0].name).toBe('활성 상품 옵션');
    expect(result[0].productOptions[0].price).toBe(1000);
    expect(result[0].productOptions[0].stock).toBe(10);

    // 캐시 확인
    const cachedResult = await cacheService.get('all_products1');
    expect(cachedResult).toBeTruthy();
    if (cachedResult) {
      expect(JSON.parse(cachedResult)).toEqual(result);
    }
  });

  it('상품은 있지만 옵션이 없는 경우 옵션 배열이 비어있어야 하고, 캐시에도 그대로 저장되어야 한다', async () => {
    //given
    await productRepository.save({
      name: '옵션 없는 상품',
      status: ProductStatus.ACTIVATE,
    });

    //when
    const result = await browseProductsUseCase.execute();

    //then
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('옵션 없는 상품');
    expect(result[0].productOptions).toHaveLength(0);

    // 캐시 확인
    const cachedResult = await cacheService.get('all_products1');
    expect(cachedResult).toBeTruthy();
    if (cachedResult) {
      expect(JSON.parse(cachedResult)).toEqual(result);
    }
  });

  it('캐시된 데이터가 있을 경우 DB 조회 없이 캐시된 데이터를 반환해야 한다', async () => {
    // given
    const cachedData = [
      {
        id: 1,
        name: '캐시된 상품',
        productOptions: [
          { id: 1, name: '캐시된 옵션', price: 1000, stock: 10 },
        ],
        status: ProductStatus.ACTIVATE,
      },
    ];
    await cacheService.set('all_products1', JSON.stringify(cachedData));

    // when
    const result = await browseProductsUseCase.execute();

    // then
    expect(result).toEqual(cachedData);
    expect(await productRepository.count()).toBe(0); // DB에 실제 데이터가 없음을 확인
  });
});
