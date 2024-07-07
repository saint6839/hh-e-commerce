import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const NOT_FOUND_USER_ERROR = '존재하지 않는 사용자입니다.';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column()
  balance: number;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;
}
