import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from 'src/common/logger/logger.service';
import { CacheService } from 'src/common/redis/redis-cache.service';
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
import { DataSource } from 'typeorm';

describe('BrowseProductsUseCase', () => {
  let useCase: BrowseProductsUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockProductOptionRepository: jest.Mocked<IProductOptionRepository>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockDataSource: any;
  let mockLoggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    mockProductRepository = {
      findAll: jest.fn(),
    } as any;

    mockProductOptionRepository = {
      findByProductId: jest.fn(),
    } as any;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    mockDataSource = {
      transaction: jest.fn((callback) => callback()),
    };

    mockLoggerService = {
      log: jest.fn(),
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
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    useCase = module.get<BrowseProductsUseCase>(BrowseProductsUseCase);
  });

  it('캐시에 데이터가 있을 경우 캐시된 데이터를 반환해야 한다', async () => {
    const cachedData = [
      new ProductDto(1, '상품1', [], ProductStatus.ACTIVATE),
      new ProductDto(2, '상품2', [], ProductStatus.ACTIVATE),
    ];
    mockCacheService.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await useCase.execute();

    expect(mockCacheService.get).toHaveBeenCalledWith('all_products1');
    expect(mockProductRepository.findAll).not.toHaveBeenCalled();
    expect(mockProductOptionRepository.findByProductId).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData);
  });

  it('캐시에 데이터가 없을 경우 DB에서 조회하고 캐시에 저장해야 한다', async () => {
    mockCacheService.get.mockResolvedValue(null);

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

    expect(mockCacheService.get).toHaveBeenCalledWith('all_products1');
    expect(mockProductRepository.findAll).toHaveBeenCalled();
    expect(mockProductOptionRepository.findByProductId).toHaveBeenCalledTimes(
      2,
    );
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'all_products1',
      expect.any(String),
      600,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(ProductDto);
    expect(result[1]).toBeInstanceOf(ProductDto);
  });

  it('상품이 없을 경우 빈 배열을 반환하고 캐시에 저장해야 한다', async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockProductRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(mockCacheService.get).toHaveBeenCalledWith('all_products1');
    expect(mockProductRepository.findAll).toHaveBeenCalled();
    expect(mockProductOptionRepository.findByProductId).not.toHaveBeenCalled();
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'all_products1',
      '[]',
      600,
    );
    expect(result).toHaveLength(0);
  });

  it('상품은 있지만 옵션이 없는 경우 옵션 배열이 비어있어야 하고 캐시에 저장해야 한다', async () => {
    mockCacheService.get.mockResolvedValue(null);
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

    mockDataSource.transaction.mockImplementation(async (callback) => {
      return callback(mockDataSource);
    });

    const result = await useCase.execute();

    expect(mockCacheService.get).toHaveBeenCalledWith('all_products1');
    expect(mockProductRepository.findAll).toHaveBeenCalledWith(mockDataSource);
    expect(mockProductOptionRepository.findByProductId).toHaveBeenCalledWith(
      1,
      mockDataSource,
    );
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'all_products1',
      expect.any(String),
      600,
    );
    expect(result).toHaveLength(1);
    expect(result[0].productOptions).toHaveLength(0);
  });
});
