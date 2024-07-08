import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import { ProductEntity } from 'src/product/infrastructure/entity/product.entity';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { BrowseProductsUseCase } from 'src/product/usecase/browse-products.usecase';

describe('BrowseProductsUseCase', () => {
  let useCase: BrowseProductsUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(async () => {
    mockProductRepository = {
      findAll: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrowseProductsUseCase,
        {
          provide: IProductRepositoryToken,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    useCase = module.get<BrowseProductsUseCase>(BrowseProductsUseCase);
  });

  it('등록된 상품이 모두 잘 조회되어야 한다.', async () => {
    const mockProductEntities: ProductEntity[] = [
      {
        id: 1,
        name: '상품1',
        price: 1000,
        stock: 10,
        status: ProductStatus.ACTIVATE,
        deletedAt: null,
      },
      {
        id: 2,
        name: '상품2',
        price: 2000,
        stock: 20,
        status: ProductStatus.ACTIVATE,
        deletedAt: null,
      },
    ];

    mockProductRepository.findAll.mockResolvedValue(mockProductEntities);

    const result = await useCase.execute();

    expect(mockProductRepository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(ProductDto);
    expect(result[1]).toBeInstanceOf(ProductDto);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});
