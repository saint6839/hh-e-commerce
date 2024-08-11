import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WebClient } from '@slack/web-api';
import { SendSlackMessageEvent } from '../event/send-slack.event';

@Injectable()
@EventsHandler(SendSlackMessageEvent)
export class SendSlackMessageListener
  implements IEventHandler<SendSlackMessageEvent>
{
  private readonly slackClient: WebClient;

  constructor() {
    this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async handle(event: SendSlackMessageEvent) {
    try {
      await this.slackClient.chat.postMessage({
        channel: event.channel,
        text: event.text,
      });
    } catch (error) {
      console.error('Failed to send Slack message:', error);
    }
  }
}
