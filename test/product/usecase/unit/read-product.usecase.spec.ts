import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from 'src/product/domain/enum/product-status.enum';
import {
  IProductRepository,
  IProductRepositoryToken,
} from 'src/product/domain/interface/repository/product.repository.interface';
import {
  NOT_FOUND_PRODUCT_ERROR,
  ProductEntity,
} from 'src/product/infrastructure/entity/product.entity';
import { ProductDto } from 'src/product/presentation/dto/response/product.dto';
import { ReadProductUseCase } from 'src/product/usecase/read-product.usecase';

describe('ReadProductUseCase', () => {
  let useCase: ReadProductUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(async () => {
    mockProductRepository = {
      findById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadProductUseCase,
        {
          provide: IProductRepositoryToken,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    useCase = module.get<ReadProductUseCase>(ReadProductUseCase);
  });

  it('존재하는 상품 ID로 조회 시 해당 상품의 정보가 반환되는지 테스트', async () => {
    //given
    const mockProductEntity: ProductEntity = {
      id: 1,
      name: '테스트 상품',
      price: 1000,
      stock: 10,
      status: ProductStatus.ACTIVATE,
      deletedAt: null,
    };
    mockProductRepository.findById.mockResolvedValue(mockProductEntity);

    //when
    const result = await useCase.execute(1);

    //then
    expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
    expect(result).toBeInstanceOf(ProductDto);
    expect(result.id).toBe(1);
    expect(result.name).toBe('테스트 상품');
    expect(result.price).toBe(1000);
    expect(result.stock).toBe(10);
  });

  it('존재하지 않는 상품 ID로 조회 시 예외가 발생하는지 테스트', async () => {
    //given
    mockProductRepository.findById.mockResolvedValue(null);

    //when & then
    await expect(useCase.execute(999)).rejects.toThrow(NOT_FOUND_PRODUCT_ERROR);
    expect(mockProductRepository.findById).toHaveBeenCalledWith(999);
  });
});
