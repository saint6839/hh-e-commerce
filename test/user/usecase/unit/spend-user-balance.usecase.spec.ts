import { Test, TestingModule } from '@nestjs/testing';
import { IUserRepositoryToken } from 'src/user/domain/interface/repository/user.repository.interface';
import { NOT_FOUND_USER_ERROR } from 'src/user/infrastructure/entity/user.entity';
import { SpendBalanceDto } from 'src/user/presentation/dto/request/spend-balance.dto';
import { SpendUserBalanceUseCase } from 'src/user/usecase/spend-user-balance.usecase';
import { DataSource, EntityManager } from 'typeorm';

describe('SpendUserBalanceUseCase Unit Test', () => {
  let spendUserBalanceUseCase: SpendUserBalanceUseCase;
  let mockUserRepository: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpendUserBalanceUseCase,
        {
          provide: IUserRepositoryToken,
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    spendUserBalanceUseCase = module.get<SpendUserBalanceUseCase>(
      SpendUserBalanceUseCase,
    );
  });

  it('사용자가 존재하고 잔액이 충분할 경우 잔액이 정상적으로 차감되는지 테스트', async () => {
    const mockUserEntity = {
      id: 1,
      name: '테스트 사용자',
      balance: 10000,
    };
    const spendBalanceDto: SpendBalanceDto = { userId: 1, amount: 3000 };

    mockUserRepository.findById.mockResolvedValue(mockUserEntity);
    mockUserRepository.update.mockResolvedValue({
      ...mockUserEntity,
      balance: 7000,
    });

    const result = await spendUserBalanceUseCase.execute(spendBalanceDto);

    expect(result.id).toBe(1);
    expect(result.name).toBe('테스트 사용자');
    expect(result.balance).toBe(7000);
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('사용자가 존재하지 않을 경우 예외가 발생하는지 테스트', async () => {
    const spendBalanceDto: SpendBalanceDto = { userId: 999, amount: 1000 };

    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      spendUserBalanceUseCase.execute(spendBalanceDto),
    ).rejects.toThrow(NOT_FOUND_USER_ERROR);
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('잔액이 부족할 경우 예외가 발생하는지 테스트', async () => {
    const mockUserEntity = {
      id: 1,
      name: '테스트 사용자',
      balance: 1000,
    };
    const spendBalanceDto: SpendBalanceDto = { userId: 1, amount: 2000 };

    mockUserRepository.findById.mockResolvedValue(mockUserEntity);

    await expect(
      spendUserBalanceUseCase.execute(spendBalanceDto),
    ).rejects.toThrow('잔액이 부족합니다');
    expect(mockDataSource.transaction).toHaveBeenCalled();
  });

  it('이미 트랜잭션이 시작된 경우 새 트랜잭션을 시작하지 않는지 테스트', async () => {
    const mockUserEntity = {
      id: 1,
      name: '테스트 사용자',
      balance: 10000,
    };
    const spendBalanceDto: SpendBalanceDto = { userId: 1, amount: 3000 };
    const mockEntityManager = {} as EntityManager;

    mockUserRepository.findById.mockResolvedValue(mockUserEntity);
    mockUserRepository.update.mockResolvedValue({
      ...mockUserEntity,
      balance: 7000,
    });

    await spendUserBalanceUseCase.execute(spendBalanceDto, mockEntityManager);

    expect(mockDataSource.transaction).not.toHaveBeenCalled();
    expect(mockUserRepository.findById).toHaveBeenCalledWith(
      1,
      mockEntityManager,
    );
    expect(mockUserRepository.update).toHaveBeenCalledWith(
      expect.any(Object),
      mockEntityManager,
    );
  });
});
