import { OutboxEntity } from '../../repository/entity/outbox.entity';

export const IOutboxRepositoryToken = Symbol('IOutboxRepository');

export interface IOutboxRepository {
  save(outboxEntity: OutboxEntity): Promise<OutboxEntity>;
  findUnpublished(): Promise<OutboxEntity[]>;
  markAsPublished(id: number): Promise<void>;
  findByEventTypeAndPayload(
    eventType: string,
    payload: string,
  ): Promise<OutboxEntity | null>;
}
