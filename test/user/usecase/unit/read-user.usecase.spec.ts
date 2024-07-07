import { Test, TestingModule } from '@nestjs/testing';
import { IUserRepositoryToken } from 'src/user/domain/interface/repository/user.repository.interface';
import {
  NOT_FOUND_USER_ERROR,
  UserEntity,
} from 'src/user/infrastructure/entity/user.entity';
import { UserDto } from 'src/user/presentation/dto/response/user.dto';
import { ReadUserUseCase } from 'src/user/usecase/read-user.usecase';

describe('ReadUserUseCase Unit Test', () => {
  let readUserUseCase: ReadUserUseCase;
  let mockUserRepository: { findById: jest.Mock };

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadUserUseCase,
        {
          provide: IUserRepositoryToken,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    readUserUseCase = module.get<ReadUserUseCase>(ReadUserUseCase);
  });

  it('userId에 일치하는 사용자가 존재할 경우 사용자 정보가 잘 반환되는지 테스트', async () => {
    const mockUserEntity: UserEntity = {
      id: 1,
      name: '테스트 사용자',
      balance: 1000,
      deletedAt: null,
    };

    mockUserRepository.findById.mockResolvedValue(mockUserEntity);

    const result = await readUserUseCase.execute(1);

    expect(result).toBeInstanceOf(UserDto);
    expect(result.id).toBe(1);
    expect(result.name).toBe('테스트 사용자');
    expect(result.balance).toBe(1000);
  });

  it('userId에 일치하는 사용자가 존재하지 않을 경우 예외가 반환되는지 테스트', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(readUserUseCase.execute(1)).rejects.toThrow(
      NOT_FOUND_USER_ERROR,
    );
  });
});
