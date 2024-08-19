import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SendSlackMessageListener {
  private readonly slackClient: WebClient;
  private readonly logger = new Logger(SendSlackMessageListener.name);

  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  @EventPattern('slack.notification')
  async handleSlackNotification(
    @Payload() payload: { channel: string; text: string },
  ) {
    try {
      await this.slackClient.chat.postMessage({
        channel: payload.channel,
        text: payload.text,
      });
      this.logger.log(`Slack message sent to ${payload.channel}`);
    } catch (error) {
      this.logger.error(`Failed to send Slack message: ${error.message}`);
    }
  }
}
