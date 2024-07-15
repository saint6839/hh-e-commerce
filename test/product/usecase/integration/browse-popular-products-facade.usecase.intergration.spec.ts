import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { IBrowsePopularProductsFacadeUseCaseToken } from 'src/product/domain/interface/usecase/browse-popular-products-facade.usecase.interface';
import { DailyPopularProductEntity } from 'src/product/infrastructure/entity/daily-popular-product.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { BrowsePopularProductsFacadeDto } from 'src/product/presentation/dto/request/browse-popular-products-facade.dto';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { BrowsePopularProductsFacadeUseCase } from 'src/product/usecase/browse-popular-products-facade.usecase';
import { setupTestingModule } from 'test/common/setup';
import { DataSource, Repository } from 'typeorm';

describe('BrowsePopularProductsFacadeUseCase (통합 테스트)', () => {
  let app: INestApplication;
  let browsePopularProductsFacadeUseCase: BrowsePopularProductsFacadeUseCase;
  let productRepository: Repository<ProductEntity>;
  let dailyPopularProductRepository: Repository<DailyPopularProductEntity>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    browsePopularProductsFacadeUseCase =
      moduleFixture.get<BrowsePopularProductsFacadeUseCase>(
        IBrowsePopularProductsFacadeUseCaseToken,
      );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    dailyPopularProductRepository = moduleFixture.get(
      getRepositoryToken(DailyPopularProductEntity),
    );
    dataSource = moduleFixture.get(DataSource);
    await dailyPopularProductRepository.clear();
    await productRepository.clear();
  });

  afterEach(async () => {
    await dailyPopularProductRepository.clear();
    await productRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('특정 기간 동안의 판매량 상위 5개 상품이 잘 조회되는지 테스트', async () => {
    // given
    const testProducts = await productRepository.save([
      { name: '상품1', status: ProductStatus.ACTIVATE },
      { name: '상품2', status: ProductStatus.ACTIVATE },
      { name: '상품3', status: ProductStatus.ACTIVATE },
      { name: '상품4', status: ProductStatus.ACTIVATE },
      { name: '상품5', status: ProductStatus.ACTIVATE },
      { name: '상품6', status: ProductStatus.ACTIVATE },
    ]);

    await dailyPopularProductRepository.save([
      {
        productId: testProducts[0].id,
        productOptionId: 1,
        soldDate: new Date(),
        totalSold: 10,
      },
      {
        productId: testProducts[1].id,
        productOptionId: 2,
        soldDate: new Date(),
        totalSold: 20,
      },
      {
        productId: testProducts[2].id,
        productOptionId: 3,
        soldDate: new Date(),
        totalSold: 30,
      },
      {
        productId: testProducts[3].id,
        productOptionId: 4,
        soldDate: new Date(),
        totalSold: 40,
      },
      {
        productId: testProducts[4].id,
        productOptionId: 5,
        soldDate: new Date(),
        totalSold: 50,
      },
      {
        productId: testProducts[5].id,
        productOptionId: 6,
        soldDate: new Date(),
        totalSold: 5,
      },
    ]);

    const dto: BrowsePopularProductsFacadeDto = {
      from: new Date(new Date().setDate(new Date().getDate() - 1)),
      to: new Date(new Date().setDate(new Date().getDate() + 1)),
    };

    // when
    const result: ProductDto[] =
      await browsePopularProductsFacadeUseCase.execute(dto);

    // then
    expect(result).toHaveLength(5);
    expect(result[0].name).toBe('상품5');
    expect(result[1].name).toBe('상품4');
    expect(result[2].name).toBe('상품3');
    expect(result[3].name).toBe('상품2');
    expect(result[4].name).toBe('상품1');
  });
});
