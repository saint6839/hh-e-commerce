import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderItemDto } from 'src/order/presentation/dto/response/order-item.dto';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { IAccumulatePopularProductsSoldUseCaseToken } from 'src/product/domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { DailyPopularProductEntity } from 'src/product/infrastructure/entity/daily-popular-product.entity';
import {
  NOT_FOUND_PRODUCT_OPTION_ERROR,
  ProductOptionEntity,
} from 'src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { AccumulatePopularProductsSoldDto } from 'src/product/presentation/dto/request/accumulate-popular-products-sold.dto';
import { AccumulatePopularProductsSoldUseCase } from 'src/product/usecase/accumulate-popular-products-sold.usecase';
import { setupTestingModule } from 'test/common/setup';
import { DataSource, Repository } from 'typeorm';

describe('AccumulatePopularProductsSoldUseCase (통합 테스트)', () => {
  let app: INestApplication;
  let accumulatePopularProductsSoldUseCase: AccumulatePopularProductsSoldUseCase;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;
  let dailyPopularProductRepository: Repository<DailyPopularProductEntity>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    accumulatePopularProductsSoldUseCase =
      moduleFixture.get<AccumulatePopularProductsSoldUseCase>(
        IAccumulatePopularProductsSoldUseCaseToken,
      );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
    dailyPopularProductRepository = moduleFixture.get(
      getRepositoryToken(DailyPopularProductEntity),
    );
    dataSource = moduleFixture.get(DataSource);
  });

  afterEach(async () => {
    await dailyPopularProductRepository.clear();
    await productOptionRepository.clear();
    await productRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('인기 상품 판매량이 성공적으로 누적되는지 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: '테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const productOption = await productOptionRepository.save({
      name: '테스트 옵션',
      price: 1000,
      stock: 100,
      productId: product.id,
    });

    const dto: AccumulatePopularProductsSoldDto = {
      orderItems: [new OrderItemDto(1, 1, productOption.id, 5, 1000)],
    };

    // when
    await accumulatePopularProductsSoldUseCase.execute(dto);

    // then
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const savedDailyPopularProduct =
      await dailyPopularProductRepository.findOne({
        where: {
          productId: product.id,
          productOptionId: productOption.id,
          soldDate: today,
        },
      });

    expect(savedDailyPopularProduct).toBeDefined();
    expect(savedDailyPopularProduct?.totalSold).toBe(5);
  });

  it('존재하지 않는 상품 옵션에 대해 예외를 발생시키는지 테스트', async () => {
    // given
    const dto: AccumulatePopularProductsSoldDto = {
      orderItems: [new OrderItemDto(1, 1, 999, 5, 1000)],
    };

    // when & then
    await expect(
      accumulatePopularProductsSoldUseCase.execute(dto),
    ).rejects.toThrow(`${NOT_FOUND_PRODUCT_OPTION_ERROR}: 999`);
  });

  it('이미 존재하는 DailyPopularProduct 엔티티에 판매량이 누적되는지 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: '테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const productOption = await productOptionRepository.save({
      name: '테스트 옵션',
      price: 1000,
      stock: 100,
      productId: product.id,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await dailyPopularProductRepository.save({
      productId: product.id,
      productOptionId: productOption.id,
      totalSold: 10,
      soldDate: today,
    });

    const dto: AccumulatePopularProductsSoldDto = {
      orderItems: [new OrderItemDto(1, 1, productOption.id, 5, 1000)],
    };

    // when
    await accumulatePopularProductsSoldUseCase.execute(dto);

    // then
    const updatedDailyPopularProduct =
      await dailyPopularProductRepository.findOne({
        where: {
          productId: product.id,
          productOptionId: productOption.id,
          soldDate: today,
        },
      });

    expect(updatedDailyPopularProduct).toBeDefined();
    expect(updatedDailyPopularProduct?.totalSold).toBe(15);
  });
});
