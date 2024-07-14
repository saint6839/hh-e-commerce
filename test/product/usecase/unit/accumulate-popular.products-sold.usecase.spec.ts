import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemDto } from 'src/order/presentation/dto/response/order-item.dto';
import { IDailyPopularProductRepositoryToken } from 'src/product/domain/interface/repository/daily-popular-product.repository.interface';
import { IProductOptionRepositoryToken } from 'src/product/domain/interface/repository/product-option.repository.interface';
import { DailyPopularProductEntity } from 'src/product/infrastructure/entity/daily-popular-product.entity';
import { NOT_FOUND_PRODUCT_OPTION_ERROR } from 'src/product/infrastructure/entity/product-option.entity';
import { AccumulatePopularProductsSoldDto } from 'src/product/presentation/dto/request/accumulate-popular-products-sold.dto';
import { AccumulatePopularProductsSoldUseCase } from 'src/product/usecase/accumulate-popular-products-sold.usecase';
import { DataSource, EntityManager } from 'typeorm';

describe('AccumulatePopularProductsSoldUseCase', () => {
  let useCase: AccumulatePopularProductsSoldUseCase;
  let mockProductOptionRepository: any;
  let mockDailyPopularProductRepository: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockProductOptionRepository = {
      findById: jest.fn(),
    };
    mockDailyPopularProductRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccumulatePopularProductsSoldUseCase,
        {
          provide: IProductOptionRepositoryToken,
          useValue: mockProductOptionRepository,
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

    useCase = module.get<AccumulatePopularProductsSoldUseCase>(
      AccumulatePopularProductsSoldUseCase,
    );
  });

  it('인기 상품 판매량이 성공적으로 누적되는지 테스트', async () => {
    const dto: AccumulatePopularProductsSoldDto = {
      orderItems: [new OrderItemDto(1, 1, 1, 1, 1)],
    };

    mockProductOptionRepository.findById.mockResolvedValue({
      id: 1,
      productId: 10,
    });

    mockDailyPopularProductRepository.findOne.mockResolvedValue(null);

    await useCase.execute(dto);

    expect(mockProductOptionRepository.findById).toHaveBeenCalledWith(
      1,
      expect.any(Object),
    );
    expect(mockDailyPopularProductRepository.findOne).toHaveBeenCalledWith(
      10,
      1,
      expect.any(Date),
      undefined,
    );
    expect(mockDailyPopularProductRepository.save).toHaveBeenCalledWith(
      expect.any(DailyPopularProductEntity),
      undefined,
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 상품 옵션에 대해 예외를 발생시키는지 테스트', async () => {
    const dto: AccumulatePopularProductsSoldDto = {
      orderItems: [new OrderItemDto(999, 1, 1, 1, 1)],
    };

    mockProductOptionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      NOT_FOUND_PRODUCT_OPTION_ERROR + ': ' + dto.orderItems[0].productOptionId,
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('이미 존재하는 DailyPopularProduct 엔티티에 판매량이 누적되는지 테스트', async () => {
    const dto: AccumulatePopularProductsSoldDto = {
      orderItems: [new OrderItemDto(1, 1, 1, 2, 1)],
    };

    mockProductOptionRepository.findById.mockResolvedValue({
      id: 1,
      productId: 10,
    });

    const mockExistingEntity = {
      accumulateTotalSold: jest.fn(),
    };
    mockDailyPopularProductRepository.findOne.mockResolvedValue(
      mockExistingEntity,
    );

    await useCase.execute(dto);

    expect(mockExistingEntity.accumulateTotalSold).toHaveBeenCalledWith(2);
    expect(mockDailyPopularProductRepository.save).toHaveBeenCalledWith(
      mockExistingEntity,
      undefined,
    );
  });

  it('이미 트랜잭션이 시작된 경우 새 트랜잭션을 시작하지 않는지 테스트', async () => {
    const dto: AccumulatePopularProductsSoldDto = {
      orderItems: [new OrderItemDto(1, 1, 1, 2, 1)],
    };

    mockProductOptionRepository.findById.mockResolvedValue({
      id: 1,
      productId: 10,
    });

    mockDailyPopularProductRepository.findOne.mockResolvedValue(null);

    const existingEntityManager = {} as EntityManager;
    await useCase.execute(dto, existingEntityManager);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(mockProductOptionRepository.findById).toHaveBeenCalledWith(
      1,
      existingEntityManager,
    );
    expect(mockDailyPopularProductRepository.findOne).toHaveBeenCalledWith(
      10,
      1,
      expect.any(Date),
      existingEntityManager,
    );
    expect(mockDailyPopularProductRepository.save).toHaveBeenCalledWith(
      expect.any(DailyPopularProductEntity),
      existingEntityManager,
    );
  });
});
