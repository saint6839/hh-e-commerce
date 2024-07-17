import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from 'src/common/logger/logger.service';
import { IUserRepositoryToken } from 'src/user/domain/interface/repository/user.repository.interface';
import {
  NOT_FOUND_USER_ERROR,
  UserEntity,
} from 'src/user/infrastructure/entity/user.entity';
import { ChargeUserDto } from 'src/user/presentation/dto/request/charge-balance.dto';
import { ChargeUserUseCase } from 'src/user/usecase/charge-user.usecase';

describe('ChargeUserUseCase Unit Test', () => {
  let chargeUserUseCase: ChargeUserUseCase;
  let mockUserRepository: { findById: jest.Mock; update: jest.Mock };
  let mockLoggerService: any;

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockLoggerService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChargeUserUseCase,
        {
          provide: IUserRepositoryToken,
          useValue: mockUserRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    chargeUserUseCase = module.get<ChargeUserUseCase>(ChargeUserUseCase);
  });

  it('사용자가 존재하고 충전이 성공적으로 이루어진 경우 테스트', async () => {
    const mockUserEntity: UserEntity = {
      id: 1,
      name: '테스트 사용자',
      balance: 1000,
      deletedAt: null,
    };

    mockUserRepository.findById.mockResolvedValue(mockUserEntity);
    mockUserRepository.update.mockResolvedValue({
      ...mockUserEntity,
      balance: 2000,
    });

    const input: ChargeUserDto = { userId: 1, amount: 1000 };
    const result = await chargeUserUseCase.execute(input);

    expect(result.id).toBe(1);
    expect(result.name).toBe('테스트 사용자');
    expect(result.balance).toBe(2000);
  });

  it('사용자가 존재하지 않는 경우 예외 발생 테스트', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const input: ChargeUserDto = { userId: 999, amount: 1000 };

    await expect(chargeUserUseCase.execute(input)).rejects.toThrow(
      NOT_FOUND_USER_ERROR,
    );
  });
});
