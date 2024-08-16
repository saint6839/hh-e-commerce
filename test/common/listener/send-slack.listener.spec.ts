import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { SendSlackMessageListener } from '../../../src/common/slack/listner/send-slack.listener';

const mockWebClient = {
  chat: {
    postMessage: jest.fn().mockResolvedValue({ ok: true }),
  },
};

jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => mockWebClient),
}));

describe('SendSlackMessageListener', () => {
  let listener: SendSlackMessageListener;
  let kafkaContainer: StartedKafkaContainer;
  let producer: Producer;
  let consumer: Consumer;
  let kafka: Kafka;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockClientKafka = {
    emit: jest.fn(),
  };

  beforeAll(async () => {
    jest.setTimeout(60000);
    kafkaContainer = await new KafkaContainer().start();
    const kafkaHost = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;

    kafka = new Kafka({
      clientId: 'test-client',
      brokers: [kafkaHost],
    });

    producer = kafka.producer();
    await producer.connect();

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
      topics: [{ topic: 'slack.notification' }],
    });
    await admin.disconnect();

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Kafka setup completed');
  }, 60000);

  afterAll(async () => {
    await producer.disconnect();
    await kafkaContainer.stop();
  }, 30000);

  beforeEach(async () => {
    process.env.SLACK_BOT_TOKEN = 'test-token';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendSlackMessageListener,
        {
          provide: 'NOTIFICATION_SERVICE',
          useValue: mockClientKafka,
        },
      ],
    }).compile();

    listener = module.get<SendSlackMessageListener>(SendSlackMessageListener);
    (listener as any).logger = mockLogger;

    consumer = kafka.consumer({ groupId: 'test-group' });
    await consumer.connect();
    await consumer.subscribe({
      topic: 'slack.notification',
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log('Received message:', message.value?.toString());
        await listener.handleSlackNotification(
          JSON.parse(message.value?.toString() || '{}'),
        );
      },
    });

    console.log('Listener setup completed');
  });

  afterEach(async () => {
    if (consumer) {
      await consumer.disconnect();
    }
    jest.clearAllMocks();
  });

  it('slack.notification 이벤트를 성공적으로 처리하는지 테스트', async () => {
    //given
    const event = {
      channel: '#test-channel',
      text: 'Test message',
    };

    //when
    await producer.send({
      topic: 'slack.notification',
      messages: [{ value: JSON.stringify(event) }],
    });

    // 메시지 처리를 위한 충분한 대기 시간
    await new Promise((resolve) => setTimeout(resolve, 5000));

    //then
    expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
      channel: event.channel,
      text: event.text,
    });
    expect(mockLogger.log).toHaveBeenCalledWith(
      `Slack message sent to ${event.channel}`,
    );
  }, 30000);

  it('Slack 메시지 전송 실패 시 에러를 로깅하는지 테스트', async () => {
    //given
    const event = {
      channel: '#test-channel',
      text: 'Test message',
    };

    const error = new Error('Slack API error');
    mockWebClient.chat.postMessage.mockRejectedValueOnce(error);

    //when
    await producer.send({
      topic: 'slack.notification',
      messages: [{ value: JSON.stringify(event) }],
    });

    // 메시지 처리를 위한 충분한 대기 시간
    await new Promise((resolve) => setTimeout(resolve, 5000));

    //then
    expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
      channel: event.channel,
      text: event.text,
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Failed to send Slack message: ${error.message}`,
    );
  }, 30000);
});
