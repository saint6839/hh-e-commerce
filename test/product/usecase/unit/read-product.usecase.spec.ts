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
import {
  NOT_FOUND_PRODUCT_ERROR,
  ProductEntity,
} from 'src/product/infrastructure/entity/product.entity';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { ReadProductUseCase } from 'src/product/usecase/read-product.usecase';

describe('ReadProductUseCase', () => {
  let useCase: ReadProductUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockProductOptionRepository: jest.Mocked<IProductOptionRepository>;

  beforeEach(async () => {
    mockProductRepository = {
      findById: jest.fn(),
    } as any;
    mockProductOptionRepository = {
      findByProductId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadProductUseCase,
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

    useCase = module.get<ReadProductUseCase>(ReadProductUseCase);
  });

  it('존재하는 상품 ID로 조회 시 해당 상품의 정보와 옵션이 반환되는지 테스트', async () => {
    // given
    const mockProductEntity: ProductEntity = {
      id: 1,
      name: '테스트 상품',
      status: ProductStatus.ACTIVATE,
      deletedAt: null,
    };
    const mockProductOptionEntities: ProductOptionEntity[] = [
      {
        id: 1,
        name: '옵션1',
        price: 1000,
        stock: 10,
        productId: 1,
        deletedAt: null,
      },
      {
        id: 2,
        name: '옵션2',
        price: 2000,
        stock: 20,
        productId: 1,
        deletedAt: null,
      },
    ];
    mockProductRepository.findById.mockResolvedValue(mockProductEntity);
    mockProductOptionRepository.findByProductId.mockResolvedValue(
      mockProductOptionEntities,
    );

    // when
    const result = await useCase.execute(1);

    // then
    expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
    expect(mockProductOptionRepository.findByProductId).toHaveBeenCalledWith(1);
    expect(result).toBeInstanceOf(ProductDto);
    expect(result.id).toBe(1);
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
    // given
    mockProductRepository.findById.mockResolvedValue(null);

    // when & then
    await expect(useCase.execute(999)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR + ': 999',
    );
    expect(mockProductRepository.findById).toHaveBeenCalledWith(999);
    expect(mockProductOptionRepository.findByProductId).not.toHaveBeenCalled();
  });
});
