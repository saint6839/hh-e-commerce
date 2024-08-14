import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  IOutboxRepository,
  IOutboxRepositoryToken,
} from '../domain/interface/outbox.repository.interface';

@Injectable()
export class OutboxProcessorService implements OnModuleInit {
  constructor(
    @Inject(IOutboxRepositoryToken)
    private readonly outboxRepository: IOutboxRepository,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    this.processOutbox();
  }

  @Interval(5000)
  async processOutbox() {
    const unpublishedEvents = await this.outboxRepository.findUnpublished();
    for (const event of unpublishedEvents) {
      try {
        await this.kafkaClient.emit(event.eventType, JSON.parse(event.payload));
        await this.outboxRepository.markAsPublished(event.id);
        this.logger.log(`이벤트 발행 성공: ${event.id}`);
      } catch (error) {
        this.logger.error(
          `미처리 이벤트 처리 실패: ${event.id}, 에러: ${error.message}`,
          error,
        );
        await this.sendSlackNotification(event, error);
      }
    }
  }

  private async sendSlackNotification(event: any, error: Error) {
    try {
      await this.kafkaClient.emit('slack.notification', {
        channel: '#error-alerts',
        text: `🚨 Outbox 미처리 이벤트 처리 실패:\n이벤트 ID: ${event.id}\n이벤트 타입: ${event.eventType}\n에러: ${error.message}`,
      });
    } catch (slackError) {
      this.logger.error(
        `Slack 알림 발송 실패: ${slackError.message}`,
        slackError,
      );
    }
  }
}
