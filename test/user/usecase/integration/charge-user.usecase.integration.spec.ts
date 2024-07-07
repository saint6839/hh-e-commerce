import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { INVALID_CHARGE_AMOUNT_ERROR } from 'src/user/domain/entity/user';
import {
  IChargeUserUsecase,
  IChargeUserUsecaseToken,
} from 'src/user/domain/interface/usecase/charge-user.usecase.interface';
import {
  NOT_FOUND_USER_ERROR,
  UserEntity,
} from 'src/user/infrastructure/entity/user.entity';
import { ChargeUserDto } from 'src/user/presentation/dto/request/charge-balance.dto';
import { setupTestingModule } from 'test/common/setup';
import { Repository } from 'typeorm';

describe('ChargeUserUseCase Integration Test', () => {
  let app: INestApplication;
  let chargeUserUseCase: IChargeUserUsecase;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await setupTestingModule();
    app = moduleFixture.createNestApplication();
    await app.init();

    chargeUserUseCase = moduleFixture.get(IChargeUserUsecaseToken);
    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  it('사용자가 존재하고 충전 금액이 0 이상인 경우 충전이 잘 이루어지는지 테스트', async () => {
    const testUser = await userRepository.save({
      name: '테스트 사용자',
      balance: 1000,
    });

    const input: ChargeUserDto = { userId: testUser.id, amount: 500 };
    const result = await chargeUserUseCase.execute(input);

    expect(result.id).toBe(testUser.id);
    expect(result.name).toBe('테스트 사용자');
    expect(result.balance).toBe(1500);

    const updatedUser = await userRepository.findOne({
      where: { id: testUser.id },
    });
    expect(updatedUser).not.toBeNull();
    expect(updatedUser!.balance).toBe(1500);
  });

  it('사용자가 존재하지만 충전 금액이 0 이하인 경우 예외가 발생하는지 테스트', async () => {
    const testUser = await userRepository.save({
      name: '테스트 사용자',
      balance: 1000,
    });

    const input: ChargeUserDto = { userId: testUser.id, amount: 0 };

    await expect(chargeUserUseCase.execute(input)).rejects.toThrow(
      INVALID_CHARGE_AMOUNT_ERROR,
    );
  });

  it('사용자가 존재하지 않는 경우 예외가 발생하는지 테스트', async () => {
    const input: ChargeUserDto = { userId: 999, amount: 1000 };

    await expect(chargeUserUseCase.execute(input)).rejects.toThrow(
      NOT_FOUND_USER_ERROR,
    );
  });

  it('사용자가 존재하지 않고, 충전 금액이 0 이하인 경우 예외가 발생하는지 테스트', async () => {
    const input: ChargeUserDto = { userId: 999, amount: 0 };

    await expect(chargeUserUseCase.execute(input)).rejects.toThrow(
      NOT_FOUND_USER_ERROR,
    );
  });
});
