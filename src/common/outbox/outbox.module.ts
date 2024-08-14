import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IOutboxRepositoryToken } from './domain/interface/outbox.repository.interface';
import { OutboxEntity } from './repository/entity/outbox.entity';
import { OutboxRepository } from './repository/repository/outbox.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity])],
  providers: [
    {
      provide: IOutboxRepositoryToken,
      useClass: OutboxRepository,
    },
  ],
  exports: [IOutboxRepositoryToken],
})
export class OutboxModule {}
