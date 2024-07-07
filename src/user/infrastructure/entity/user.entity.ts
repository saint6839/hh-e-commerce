import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
