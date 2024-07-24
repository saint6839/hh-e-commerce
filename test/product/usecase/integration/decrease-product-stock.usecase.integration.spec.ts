import { INestApplication, Logger } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import { IDecreaseProductStockUsecaseToken } from 'src/product/domain/interface/usecase/decrease-product-stock.usecase.interface';
import {
  NOT_FOUND_PRODUCT_OPTION_ERROR,
  ProductOptionEntity,
} from 'src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { DecreaseProductStockDto } from 'src/product/presentation/dto/request/decrease-product-stock.dto';
import { DecreaseProductStockUseCase } from 'src/product/usecase/decrease-product-stock.usecase';
import { setupTestingModule, teardownTestingModule } from 'test/common/setup';
import { DataSource, Repository } from 'typeorm';

describe('DecreaseProductStockUseCase (통합 테스트)', () => {
  let moduleFixture: TestingModule;
  let app: INestApplication;
  let decreaseProductStockUseCase: DecreaseProductStockUseCase;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;
  let dataSource: DataSource;
  let loggerService: LoggerService;

  beforeAll(async () => {
    moduleFixture = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    app.useLogger(new Logger());
    await app.init();

    decreaseProductStockUseCase =
      moduleFixture.get<DecreaseProductStockUseCase>(
        IDecreaseProductStockUsecaseToken,
      );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
    dataSource = moduleFixture.get(DataSource);
    loggerService = moduleFixture.get(LoggerService);
  });

  afterAll(async () => {
    await app.close();
    await teardownTestingModule(moduleFixture);
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

  it('동시에 여러 요청이 들어올 때 재고를 정확하게 감소시키는지 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: '동시성 테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const initialStock = 1000;
    const productOption = await productOptionRepository.save({
      name: '동시성 테스트 옵션',
      price: 1000,
      stock: initialStock,
      productId: product.id,
    });

    const decreaseAmount = 1;
    const concurrentRequests = 1000;

    // when
    const decreasePromises = Array(concurrentRequests)
      .fill(null)
      .map(() =>
        decreaseProductStockUseCase.execute({
          productOptionId: productOption.id,
          quantity: decreaseAmount,
        }),
      );

    await Promise.all(decreasePromises);

    // then
    const updatedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });

    expect(updatedProductOption).toBeDefined();
    expect(updatedProductOption?.stock).toBe(
      initialStock - decreaseAmount * concurrentRequests,
    );
  }, 30000);

  it('동시 요청 중 재고 부족 상황 처리 테스트', async () => {
    // given
    const product = await productRepository.save({
      name: '재고 부족 테스트 상품',
      status: ProductStatus.ACTIVATE,
    });

    const initialStock = 25;
    const productOption = await productOptionRepository.save({
      name: '재고 부족 테스트 옵션',
      price: 1000,
      stock: initialStock,
      productId: product.id,
    });

    const decreaseAmount = 10;
    const concurrentRequests = 3; // 총 30개 감소 시도 (25개 재고)

    // when
    const decreasePromises = Array(concurrentRequests)
      .fill(null)
      .map(() =>
        decreaseProductStockUseCase.execute({
          productOptionId: productOption.id,
          quantity: decreaseAmount,
        }),
      );

    const results = await Promise.allSettled(decreasePromises);

    // then
    const successfulRequests = results.filter(
      (r) => r.status === 'fulfilled',
    ).length;
    const failedRequests = results.filter(
      (r) => r.status === 'rejected',
    ).length;

    expect(successfulRequests).toBe(2); // 2개 요청 성공 (20개 감소)
    expect(failedRequests).toBe(1); // 1개 요청 실패 (재고 부족)

    const updatedProductOption = await productOptionRepository.findOne({
      where: { id: productOption.id },
    });

    expect(updatedProductOption).toBeDefined();
    expect(updatedProductOption?.stock).toBe(5); // 25 - (10 * 2) = 5
  });
});
