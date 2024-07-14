import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  IReadUserUsecase,
  IReadUserUsecaseToken,
} from 'src/user/domain/interface/usecase/read-user.usecase.interface';
import {
  NOT_FOUND_USER_ERROR,
  UserEntity,
} from 'src/user/infrastructure/entity/user.entity';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('ReadUserUseCase Integration Test', () => {
  let app: INestApplication;
  let readUserUseCase: IReadUserUsecase;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    readUserUseCase = moduleFixture.get(IReadUserUsecaseToken);
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepository.clear();
  });

  it('userId에 일치하는 사용자가 존재할 경우, 해당 사용자의 정보(잔액)가 조회되는지 테스트', async () => {
    const testUser = await userRepository.save({
      name: '테스트 사용자',
      balance: 1000,
    });

    const result = await readUserUseCase.execute(testUser.id);

    expect(result).toBeDefined();
    expect(result.id).toBe(testUser.id);
    expect(result.name).toBe('테스트 사용자');
    expect(result.balance).toBe(1000);
  });

  it('userId에 일치하는 사용자가 존재하지 않는 경우, 예외가 발생되는지 테스트', async () => {
    const nonExistentUserId = 9999;

    await expect(readUserUseCase.execute(nonExistentUserId)).rejects.toThrow(
      NOT_FOUND_USER_ERROR,
    );
  });
});
