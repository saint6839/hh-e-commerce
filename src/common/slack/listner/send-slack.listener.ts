import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SendSlackMessageListener {
  private readonly slackClient: WebClient;
  private readonly logger = new Logger(SendSlackMessageListener.name);

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  @MessagePattern('slack.notification')
  async handleSlackNotification(payload: { channel: string; text: string }) {
    try {
      await this.slackClient.chat.postMessage({
        channel: payload.channel,
        text: payload.text,
      });
      this.logger.log(`Slack message sent to ${payload.channel}`);
    } catch (error) {
      this.logger.error(`Failed to send Slack message: ${error.message}`);
      this.kafkaClient.emit('slack.notification.error', {
        error: error.message,
        originalPayload: payload,
      });
    }
  }
}
