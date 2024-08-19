import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from '../logger/logger.service';
import { IOutboxRepositoryToken } from './domain/interface/outbox.repository.interface';
import { OutboxEntity } from './repository/entity/outbox.entity';
import { OutboxRepository } from './repository/repository/outbox.repository';
import { OutboxProcessorService } from './service/outbox-processor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEntity]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'outbox',
            brokers: ['localhost:29092'],
          },
          consumer: {
            groupId: 'outbox-consumer',
          },
        },
      },
    ]),
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: IOutboxRepositoryToken,
      useClass: OutboxRepository,
    },
    OutboxProcessorService,
    LoggerService,
  ],
  exports: [IOutboxRepositoryToken, OutboxProcessorService],
})
export class OutboxModule {}
