import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from 'src/product/domain/interface/repository/product-option.repository.interface';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import { ProductOptionEntity } from 'src/product/infrastructure/entity/product-option.entity';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { BrowseProductsUseCase } from 'src/product/usecase/browse-products.usecase';

describe('BrowseProductsUseCase', () => {
  let useCase: BrowseProductsUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockProductOptionRepository: jest.Mocked<IProductOptionRepository>;

  beforeEach(async () => {
    mockProductRepository = {
      findAll: jest.fn(),
    } as any;

    mockProductOptionRepository = {
      findByProductId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrowseProductsUseCase,
        {
          provide: IProductRepositoryToken,
          useValue: mockProductRepository,
        },
        {
          provide: IProductOptionRepositoryToken,
          useValue: mockProductOptionRepository,
        },
      ],
    }).compile();

    useCase = module.get<BrowseProductsUseCase>(BrowseProductsUseCase);
  });

  it('등록된 상품과 옵션이 모두 잘 조회되어야 한다.', async () => {
    const mockProductEntities: ProductEntity[] = [
      {
        id: 1,
        name: '상품1',
        status: ProductStatus.ACTIVATE,
        deletedAt: null,
      },
      {
        id: 2,
        name: '상품2',
        status: ProductStatus.ACTIVATE,
        deletedAt: null,
      },
    ];

    const mockProductOptionEntities: ProductOptionEntity[] = [
      {
        id: 1,
        name: '옵션1',
        price: 1000,
        stock: 10,
        productId: 1,
      },
      {
        id: 2,
        name: '옵션2',
        price: 2000,
        stock: 20,
        productId: 2,
      },
    ];

    mockProductRepository.findAll.mockResolvedValue(mockProductEntities);
    mockProductOptionRepository.findByProductId.mockImplementation(
      (productId) =>
        Promise.resolve(
          mockProductOptionEntities.filter(
            (option) => option.productId === productId,
          ),
        ),
    );

    const result = await useCase.execute();

    expect(mockProductRepository.findAll).toHaveBeenCalled();
    expect(mockProductOptionRepository.findByProductId).toHaveBeenCalledTimes(
      2,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(ProductDto);
    expect(result[1]).toBeInstanceOf(ProductDto);
    expect(result[0].id).toBe(1);
    expect(result[0].productOptions).toHaveLength(1);
    expect(result[0].productOptions[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[1].productOptions).toHaveLength(1);
    expect(result[1].productOptions[0].id).toBe(2);
  });

  it('상품이 없을 경우 빈 배열을 반환해야 한다', async () => {
    mockProductRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(mockProductRepository.findAll).toHaveBeenCalled();
    expect(mockProductOptionRepository.findByProductId).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  it('상품은 있지만 옵션이 없는 경우 옵션 배열이 비어있어야 한다', async () => {
    const mockProductEntities: ProductEntity[] = [
      {
        id: 1,
        name: '상품1',
        status: ProductStatus.ACTIVATE,
        deletedAt: null,
      },
    ];

    mockProductRepository.findAll.mockResolvedValue(mockProductEntities);
    mockProductOptionRepository.findByProductId.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(mockProductRepository.findAll).toHaveBeenCalled();
    expect(mockProductOptionRepository.findByProductId).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0].productOptions).toHaveLength(0);
  });
});
