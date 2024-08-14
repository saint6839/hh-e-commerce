import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('outbox')
export class OutboxEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  aggregateType: string;

  @Column()
  aggregateId: string;

  @Column()
  eventType: string;

  @Column('json')
  payload: string;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
