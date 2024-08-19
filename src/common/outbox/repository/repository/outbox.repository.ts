import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOutboxRepository } from '../../domain/interface/outbox.repository.interface';
import { OutboxEntity } from '../entity/outbox.entity';

@Injectable()
export class OutboxRepository implements IOutboxRepository {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
  ) {}
  async findByEventTypeAndPayload(
    eventType: string,
    payload: string,
  ): Promise<OutboxEntity | null> {
    return this.outboxRepository.findOne({
      where: { eventType, payload },
    });
  }

  async save(outboxEntity: OutboxEntity): Promise<OutboxEntity> {
    return this.outboxRepository.save(outboxEntity);
  }

  async findUnpublished(): Promise<OutboxEntity[]> {
    return this.outboxRepository.find({ where: { published: false } });
  }

  async markAsPublished(id: number): Promise<void> {
    await this.outboxRepository.update(id, { published: true });
  }
}
