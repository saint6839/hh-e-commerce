import { Test, TestingModule } from '@nestjs/testing';
import { ICartRepositoryToken } from 'src/cart/domain/interface/repository/cart.repository.interface';
import { AddCartProductDetailDto } from 'src/cart/presentation/dto/request/add-cart-product-detail.dto';
import { AddCartUseCase } from 'src/cart/usecase/add-cart.usecase';
import { ProductOption } from 'src/product/domain/entity/product-option';
import { IProductOptionRepositoryToken } from 'src/product/domain/interface/repository/product-option.repository.interface';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from 'src/product/infrastructure/entity/product-option.entity';
import { DataSource, EntityManager } from 'typeorm';

describe('AddCartUseCase', () => {
  let addCartUseCase: AddCartUseCase;
  let mockProductOptionRepository: any;
  let mockCartRepository: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockProductOptionRepository = {
      findById: jest.fn(),
    };
    mockCartRepository = {
      create: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddCartUseCase,
        {
          provide: IProductOptionRepositoryToken,
          useValue: mockProductOptionRepository,
        },
        { provide: ICartRepositoryToken, useValue: mockCartRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    addCartUseCase = module.get<AddCartUseCase>(AddCartUseCase);
  });

  it('장바구니에 상품을 성공적으로 추가하는지 테스트', async () => {
    const dto: AddCartProductDetailDto = {
      userId: 1,
      productOptionId: 1,
      quantity: 2,
    };

    const mockProductOptionEntity = {
      id: 1,
      name: 'Test Option',
      price: 1000,
    };

    const mockCartEntity = {
      id: 1,
      userId: 1,
      productOptionId: 1,
      quantity: 2,
    };

    mockProductOptionRepository.findById.mockResolvedValue(
      mockProductOptionEntity,
    );
    mockCartRepository.create.mockResolvedValue(mockCartEntity);

    jest.spyOn(ProductOption, 'fromEntity').mockReturnValue({
      toDto: () => ({ id: 1, name: 'Test Option', price: 1000 }),
    } as any);

    const result = await addCartUseCase.execute(dto);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.productOption.id).toBe(1);
    expect(result.quantity).toBe(2);
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 상품 옵션에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: AddCartProductDetailDto = {
      userId: 1,
      productOptionId: 999,
      quantity: 2,
    };

    mockProductOptionRepository.findById.mockResolvedValue(null);

    await expect(addCartUseCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_OPTION_ERROR + ': 999',
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('이미 트랜잭션이 시작된 경우 새 트랜잭션을 시작하지 않는지 테스트', async () => {
    const dto: AddCartProductDetailDto = {
      userId: 1,
      productOptionId: 1,
      quantity: 2,
    };

    const mockProductOptionEntity = {
      id: 1,
      name: 'Test Option',
      price: 1000,
    };

    const mockCartEntity = {
      id: 1,
      userId: 1,
      productOptionId: 1,
      quantity: 2,
    };

    mockProductOptionRepository.findById.mockResolvedValue(
      mockProductOptionEntity,
    );
    mockCartRepository.create.mockResolvedValue(mockCartEntity);

    jest.spyOn(ProductOption, 'fromEntity').mockReturnValue({
      toDto: () => ({ id: 1, name: 'Test Option', price: 1000 }),
    } as any);

    const existingEntityManager = {} as EntityManager;
    await addCartUseCase.execute(dto, existingEntityManager);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(mockProductOptionRepository.findById).toHaveBeenCalledWith(
      1,
      existingEntityManager,
    );
    expect(mockCartRepository.create).toHaveBeenCalledWith(
      expect.anything(),
      existingEntityManager,
    );
  });
});
