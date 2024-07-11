import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import {
  IDailyPopularProductRepository,
  IDailyPopularProductRepositoryToken,
} from 'src/product/domain/interface/repository/daily-popular-product.repository.interface';
import {
  IReadProductUseCase,
  IReadProductUseCaseToken,
} from 'src/product/domain/interface/usecase/read-product.usecase.interface';
import { BrowsePopularProductsFacadeDto } from 'src/product/presentation/dto/request/browse-popular-products-facade.dto';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { BrowsePopularProductsFacadeUseCase } from 'src/product/usecase/browse-popular-products-facade.usecase';
import { DataSource } from 'typeorm';

describe('BrowsePopularProductsFacadeUseCase', () => {
  let useCase: BrowsePopularProductsFacadeUseCase;
  let mockReadProductUseCase: jest.Mocked<IReadProductUseCase>;
  let mockDailyPopularProductRepository: jest.Mocked<IDailyPopularProductRepository>;
  let mockDataSource: jest.Mocked<any>;

  beforeEach(async () => {
    mockReadProductUseCase = {
      execute: jest.fn(),
    } as any;

    mockDailyPopularProductRepository = {
      findTopSoldByDateRange: jest.fn(),
    } as any;

    mockDataSource = {
      transaction: jest.fn((callback) => callback()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrowsePopularProductsFacadeUseCase,
        {
          provide: IReadProductUseCaseToken,
          useValue: mockReadProductUseCase,
        },
        {
          provide: IDailyPopularProductRepositoryToken,
          useValue: mockDailyPopularProductRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    useCase = module.get<BrowsePopularProductsFacadeUseCase>(
      BrowsePopularProductsFacadeUseCase,
    );
  });

  it('인기 상품 조회 usecase의 기능 호출이 잘 이루어지는지 테스트', async () => {
    const mockDailyPopularProductEntities = [
      {
        id: 1,
        productOptionId: 1,
        totalSold: 10,
        soldDate: new Date(),
        productId: 1,
        updatedAt: new Date(),
      },
      {
        id: 2,
        productOptionId: 2,
        totalSold: 20,
        soldDate: new Date(),
        productId: 2,
        updatedAt: new Date(),
      },
      {
        id: 3,
        productOptionId: 3,
        totalSold: 30,
        soldDate: new Date(),
        productId: 1,
        updatedAt: new Date(),
      },
      {
        id: 4,
        productOptionId: 4,
        totalSold: 40,
        soldDate: new Date(),
        productId: 2,
        updatedAt: new Date(),
      },
      {
        id: 5,
        productOptionId: 5,
        totalSold: 50,
        soldDate: new Date(),
        productId: 1,
        updatedAt: new Date(),
      },
    ];

    const mockProductDtos = [
      new ProductDto(1, 'Product 1', [], ProductStatus.ACTIVATE),
      new ProductDto(2, 'Product 2', [], ProductStatus.ACTIVATE),
      new ProductDto(3, 'Product 3', [], ProductStatus.ACTIVATE),
      new ProductDto(4, 'Product 4', [], ProductStatus.ACTIVATE),
      new ProductDto(5, 'Product 5', [], ProductStatus.ACTIVATE),
    ];

    mockDailyPopularProductRepository.findTopSoldByDateRange.mockResolvedValue(
      mockDailyPopularProductEntities.map((entity) => ({
        ...entity,
        accumulateTotalSold: (quantity: number) =>
          (entity.totalSold += quantity),
      })),
    );
    mockDataSource.transaction.mockImplementation(async (callback) => {
      return callback(mockDataSource);
    });

    mockReadProductUseCase.execute
      .mockResolvedValueOnce(mockProductDtos[0])
      .mockResolvedValueOnce(mockProductDtos[1]);

    const dto = new BrowsePopularProductsFacadeDto(
      new Date('2021-08-01T00:00:00'),
      new Date('2021-08-31T23:59:59'),
    );

    const result = await useCase.execute(dto);

    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});
