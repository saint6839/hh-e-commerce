import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IBrowseCartUseCaseToken } from 'src/cart/domain/interface/usecase/browse-cart.usecase.interface';
import { CartEntity } from 'src/cart/infrastructure/entity/cart.entity';
import { BrowseCartUseCase } from 'src/cart/usecase/browse-cart.usecase';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import {
  NOT_FOUND_PRODUCT_OPTION_ERROR,
  ProductOptionEntity,
} from 'src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('BrowseCartUseCase Integration Test', () => {
  let app: INestApplication;
  let browseCartUseCase: BrowseCartUseCase;
  let cartRepository: Repository<CartEntity>;
  let productRepository: Repository<ProductEntity>;
  let productOptionRepository: Repository<ProductOptionEntity>;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    browseCartUseCase = moduleFixture.get<BrowseCartUseCase>(
      IBrowseCartUseCaseToken,
    );
    cartRepository = moduleFixture.get(getRepositoryToken(CartEntity));
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productOptionRepository = moduleFixture.get(
      getRepositoryToken(ProductOptionEntity),
    );
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cartRepository.clear();
    await productOptionRepository.clear();
    await productRepository.clear();
    await userRepository.clear();
  });

  it('사용자의 장바구니 항목을 성공적으로 조회하는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    const product = await productRepository.save({
      name: 'Test Product',
      status: ProductStatus.ACTIVATE,
    });

    const productOption = await productOptionRepository.save({
      name: 'Test Option',
      price: 1000,
      stock: 10,
      productId: product.id,
    });

    await cartRepository.save({
      userId: user.id,
      productOptionId: productOption.id,
      quantity: 2,
    });

    // when
    const result = await browseCartUseCase.execute(user.id);

    // then
    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].productOption.id).toBe(productOption.id);
    expect(result[0].productOption.name).toBe(productOption.name);
    expect(result[0].productOption.price).toBe(productOption.price);
    expect(result[0].quantity).toBe(2);
  });

  it('장바구니가 비어있을 경우 빈 배열을 반환하는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    // when
    const result = await browseCartUseCase.execute(user.id);

    // then
    expect(result).toHaveLength(0);
  });

  it('존재하지 않는 상품 옵션에 대해 예외를 발생시키는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    await cartRepository.save({
      userId: user.id,
      productOptionId: 999, // 존재하지 않는 상품 옵션 ID
      quantity: 1,
    });

    // when & then
    await expect(browseCartUseCase.execute(user.id)).rejects.toThrow(
      `${NOT_FOUND_PRODUCT_OPTION_ERROR}: 999`,
    );
  });

  it('여러 장바구니 항목을 올바르게 조회하는지 테스트', async () => {
    // given
    const user = await userRepository.save({
      name: 'Test User',
      balance: 10000,
    });

    const product1 = await productRepository.save({
      name: 'Product 1',
      status: ProductStatus.ACTIVATE,
    });

    const product2 = await productRepository.save({
      name: 'Product 2',
      status: ProductStatus.ACTIVATE,
    });

    const productOption1 = await productOptionRepository.save({
      name: 'Option 1',
      price: 1000,
      stock: 10,
      productId: product1.id,
    });

    const productOption2 = await productOptionRepository.save({
      name: 'Option 2',
      price: 2000,
      stock: 5,
      productId: product2.id,
    });

    await cartRepository.save([
      {
        userId: user.id,
        productOptionId: productOption1.id,
        quantity: 2,
      },
      {
        userId: user.id,
        productOptionId: productOption2.id,
        quantity: 1,
      },
    ]);

    // when
    const result = await browseCartUseCase.execute(user.id);

    // then
    expect(result).toHaveLength(2);
    expect(result[0].productOption.id).toBe(productOption1.id);
    expect(result[0].quantity).toBe(2);
    expect(result[1].productOption.id).toBe(productOption2.id);
    expect(result[1].quantity).toBe(1);
  });
});
