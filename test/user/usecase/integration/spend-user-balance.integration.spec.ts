import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ISpendUserBalanceUsecase,
  ISpendUserBalanceUsecaseToken,
} from 'src/user/domain/interface/usecase/spend-user-balance.usecase.interface';
import {
  NOT_FOUND_USER_ERROR,
  UserEntity,
} from 'src/user/infrastructure/entity/user.entity';
import { SpendBalanceDto } from 'src/user/presentation/dto/request/spend-balance.dto';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('SpendUserBalanceUseCase 통합 테스트', () => {
  let app: INestApplication;
  let spendUserBalanceUseCase: ISpendUserBalanceUsecase;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    spendUserBalanceUseCase = moduleFixture.get(ISpendUserBalanceUsecaseToken);
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepository.clear();
  });

  it('사용자가 존재하고 잔액이 충분할 경우 잔액이 정상적으로 차감되는지 테스트', async () => {
    const testUser = await userRepository.save({
      name: '테스트 사용자',
      balance: 10000,
    });

    const spendBalanceDto: SpendBalanceDto = {
      userId: testUser.id,
      amount: 3000,
    };

    const result = await spendUserBalanceUseCase.execute(spendBalanceDto);

    expect(result.id).toBe(testUser.id);
    expect(result.name).toBe('테스트 사용자');
    expect(result.balance).toBe(7000);

    const updatedUser = await userRepository.findOne({
      where: { id: testUser.id },
    });
    expect(updatedUser).not.toBeNull();
    expect(updatedUser!.balance).toBe(7000);
  });

  it('사용자가 존재하지 않을 경우 예외가 발생하는지 테스트', async () => {
    const spendBalanceDto: SpendBalanceDto = {
      userId: 999,
      amount: 1000,
    };

    await expect(
      spendUserBalanceUseCase.execute(spendBalanceDto),
    ).rejects.toThrow(NOT_FOUND_USER_ERROR);
  });

  it('잔액이 부족할 경우 예외가 발생하는지 테스트', async () => {
    const testUser = await userRepository.save({
      name: '테스트 사용자',
      balance: 1000,
    });

    const spendBalanceDto: SpendBalanceDto = {
      userId: testUser.id,
      amount: 2000,
    };

    await expect(
      spendUserBalanceUseCase.execute(spendBalanceDto),
    ).rejects.toThrow('잔액이 부족합니다');

    const unchangedUser = await userRepository.findOne({
      where: { id: testUser.id },
    });
    expect(unchangedUser).not.toBeNull();
    expect(unchangedUser!.balance).toBe(1000);
  });

  it('여러 요청이 동시에 들어왔을 실패하는 케이스가 존재하는지 테스트 ', async () => {
    const initialBalance = 10000;
    const spendAmount = 3000;
    const concurrentRequests = 5;

    const testUser = await userRepository.save({
      name: '테스트 사용자',
      balance: initialBalance,
    });

    const spendBalanceDto: SpendBalanceDto = {
      userId: testUser.id,
      amount: spendAmount,
    };

    const promises = Array(concurrentRequests)
      .fill(null)
      .map(() => spendUserBalanceUseCase.execute(spendBalanceDto));

    const results = await Promise.allSettled(promises);

    const failedRequests = results.filter(
      (result) => result.status === 'rejected',
    );

    expect(failedRequests.length).not.toBe(0);
  });
});
