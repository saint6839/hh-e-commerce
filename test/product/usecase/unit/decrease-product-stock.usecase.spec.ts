import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from 'src/common/logger/logger.service';
import { RedisLockService } from 'src/common/redis/redis-lock.service';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import {
  IProductOptionRepository,
  IProductOptionRepositoryToken,
} from 'src/product/domain/interface/repository/product-option.repository.interface';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from 'src/product/infrastructure/entity/product-option.entity';
import { NOT_FOUND_PRODUCT_ERROR } from 'src/product/infrastructure/entity/product.entity';
import { DecreaseProductStockDto } from 'src/product/presentation/dto/request/decrease-product-stock.dto';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { DecreaseProductStockUseCase } from 'src/product/usecase/decrease-product-stock.usecase';
import { DataSource, EntityManager } from 'typeorm';

describe('DecreaseProductStockUseCase', () => {
  let useCase: DecreaseProductStockUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockProductOptionRepository: jest.Mocked<IProductOptionRepository>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockRedisLockService: jest.Mocked<RedisLockService>;
  let mockLoggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    mockProductRepository = {
      findByIdWithLock: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockProductOptionRepository = {
      findByIdWithLock: jest.fn(),
      findById: jest.fn(),
      updateStock: jest.fn(),
    } as any;
    mockEntityManager = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    } as any;
    mockRedisLockService = {
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
    } as any;
    mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    mockDataSource = {
      transaction: jest.fn((cb) => cb(mockEntityManager)),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecreaseProductStockUseCase,
        { provide: IProductRepositoryToken, useValue: mockProductRepository },
        {
          provide: IProductOptionRepositoryToken,
          useValue: mockProductOptionRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: RedisLockService, useValue: mockRedisLockService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    useCase = module.get<DecreaseProductStockUseCase>(
      DecreaseProductStockUseCase,
    );
  });

  it('상품 옵션의 재고를 성공적으로 감소시키는지 테스트', async () => {
    const dto: DecreaseProductStockDto = { productOptionId: 1, quantity: 2 };
    const mockProductOptionEntity = {
      id: 1,
      name: '옵션1',
      price: 1000,
      stock: 10,
      productId: 1,
    };
    const mockProductEntity = {
      id: 1,
      name: '상품1',
      status: ProductStatus.ACTIVATE,
    };

    mockProductOptionRepository.findById.mockResolvedValue(
      mockProductOptionEntity,
    );
    mockProductRepository.findById.mockResolvedValue(mockProductEntity);

    const result = await useCase.execute(dto);

    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(mockProductOptionRepository.findById).toHaveBeenCalledWith(
      1,
      mockEntityManager,
    );
    expect(mockProductOptionRepository.updateStock).toHaveBeenCalledWith(
      1,
      8,
      mockEntityManager,
    );
    expect(mockProductRepository.findById).toHaveBeenCalledWith(
      1,
      mockEntityManager,
    );
    expect(result).toBeInstanceOf(ProductDto);
    expect(result.id).toBe(1);
    expect(result.name).toBe('상품1');
    expect(result.productOptions).toHaveLength(1);
    expect(result.productOptions[0].stock).toBe(8);
  });

  it('존재하지 않는 상품 옵션에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: DecreaseProductStockDto = { productOptionId: 999, quantity: 1 };
    mockProductOptionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_OPTION_ERROR + ': 999',
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 상품에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: DecreaseProductStockDto = { productOptionId: 1, quantity: 1 };
    const mockProductOptionEntity = {
      id: 1,
      name: '옵션1',
      price: 1000,
      stock: 10,
      productId: 999,
    };

    mockProductOptionRepository.findById.mockResolvedValue(
      mockProductOptionEntity,
    );
    mockProductRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_ERROR + ': 999',
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('이미 트랜잭션이 시작된 경우 새 트랜잭션을 시작하지 않는지 테스트', async () => {
    const dto: DecreaseProductStockDto = { productOptionId: 1, quantity: 2 };
    const mockProductOptionEntity = {
      id: 1,
      name: '옵션1',
      price: 1000,
      stock: 10,
      productId: 1,
    };
    const mockProductEntity = {
      id: 1,
      name: '상품1',
      status: ProductStatus.ACTIVATE,
    };

    mockProductOptionRepository.findById.mockResolvedValue(
      mockProductOptionEntity,
    );
    mockProductRepository.findById.mockResolvedValue(mockProductEntity);

    const existingEntityManager = {} as EntityManager;
    await useCase.execute(dto, existingEntityManager);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(mockProductOptionRepository.findById).toHaveBeenCalledWith(
      1,
      existingEntityManager,
    );
    expect(mockProductOptionRepository.updateStock).toHaveBeenCalledWith(
      1,
      8,
      existingEntityManager,
    );
    expect(mockProductRepository.findById).toHaveBeenCalledWith(
      1,
      existingEntityManager,
    );
  });
});
