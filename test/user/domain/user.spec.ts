import { INVALID_CHARGE_AMOUNT_ERROR, User } from 'src/user/domain/entity/user';
import { UserEntity } from 'src/user/infrastructure/entity/user.entity';
import { UserDto } from 'src/user/presentation/dto/response/user.dto';

describe('User', () => {
  let user: User;

  beforeEach(() => {
    user = new User(1, '홍길동', 1000);
  });

  describe('생성자', () => {
    it('올바른 값으로 User 인스턴스를 생성해야 한다', () => {
      expect(user.id).toBe(1);
      expect(user.name).toBe('홍길동');
      expect(user.balance).toBe(1000);
    });
  });

  describe('charge', () => {
    it('양수 금액으로 잔액을 증가시켜야 한다', () => {
      user.charge(500);
      expect(user.balance).toBe(1500);
    });

    it('0 이하의 금액으로 충전 시 에러를 발생시켜야 한다', () => {
      expect(() => user.charge(0)).toThrow(INVALID_CHARGE_AMOUNT_ERROR);
      expect(() => user.charge(-100)).toThrow(INVALID_CHARGE_AMOUNT_ERROR);
    });
  });

  describe('fromEntity', () => {
    it('UserEntity로부터 User 인스턴스를 생성해야 한다', () => {
      const entity = new UserEntity();
      entity.id = 2;
      entity.name = '김철수';
      entity.balance = 2000;

      const userFromEntity = User.fromEntity(entity);
      expect(userFromEntity.id).toBe(2);
      expect(userFromEntity.name).toBe('김철수');
      expect(userFromEntity.balance).toBe(2000);
    });
  });

  describe('toEntity', () => {
    it('User 인스턴스로부터 UserEntity를 생성해야 한다', () => {
      const entity = user.toEntity();
      expect(entity.id).toBe(1);
      expect(entity.name).toBe('홍길동');
      expect(entity.balance).toBe(1000);
    });
  });

  describe('toDto', () => {
    it('User 인스턴스로부터 UserDto를 생성해야 한다', () => {
      const dto = user.toDto();
      expect(dto.id).toBe(1);
      expect(dto.name).toBe('홍길동');
      expect(dto.balance).toBe(1000);
    });
  });

  describe('fromDto', () => {
    it('UserDto로부터 User 인스턴스를 생성해야 한다', () => {
      const dto = new UserDto(3, '이영희', 3000);
      const userFromDto = User.fromDto(dto);
      expect(userFromDto.id).toBe(3);
      expect(userFromDto.name).toBe('이영희');
      expect(userFromDto.balance).toBe(3000);
    });
  });
});
