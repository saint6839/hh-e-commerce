import { ClientKafka } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { Consumer, Kafka, Message, Partitioners, Producer } from 'kafkajs';
import { AppController } from 'src/app.controller';

// KafkaJS 경고 메시지 억제
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

describe('AppController', () => {
  let appController: AppController;
  let kafkaClient: ClientKafka;
  let kafkaContainer: StartedKafkaContainer;
  let kafka: Kafka;
  let producer: Producer;
  let consumer: Consumer;

  beforeAll(async () => {
    jest.setTimeout(120000); // 타임아웃을 2분으로 설정

    try {
      kafkaContainer = await new KafkaContainer().start();
      const brokers = [
        `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`,
      ];

      // Kafka 컨테이너가 완전히 준비될 때까지 대기
      await waitForKafka(brokers);

      kafka = new Kafka({ brokers });
      producer = kafka.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
      });
      consumer = kafka.consumer({ groupId: 'test-group' });

      await producer.connect();
      await consumer.connect();

      // 테스트 토픽 생성
      const admin = kafka.admin();
      await admin.connect();
      await admin.createTopics({
        topics: [
          { topic: 'producer-test-topic' },
          { topic: 'test-topic' },
          { topic: 'print' },
        ],
      });
      await admin.disconnect();

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          {
            provide: 'PAYMENT_SERVICE',
            useValue: {
              connect: jest.fn(),
              close: jest.fn(),
              emit: jest.fn(),
            },
          },
        ],
      }).compile();

      appController = module.get<AppController>(AppController);
      kafkaClient = module.get<ClientKafka>('PAYMENT_SERVICE');
    } catch (error) {
      console.error('Kafka 컨테이너 시작 중 오류 발생:', error);
      throw error;
    }
  }, 120000);

  afterAll(async () => {
    if (producer) await producer.disconnect();
    if (consumer) await consumer.disconnect();
    if (kafkaContainer) await kafkaContainer.stop();
  });

  it('print 이벤트가 발행되는지 테스트', async () => {
    const message = { message: 'test message' };
    jest.spyOn(kafkaClient, 'emit').mockReturnValueOnce({
      toPromise: jest.fn().mockResolvedValueOnce([{ topicName: 'print' }]),
    } as any);

    await appController.print(message);

    expect(kafkaClient.emit).toHaveBeenCalledWith('print', {
      value: 'test message',
    });
  });

  it('print 이벤트가 처리 되는지 테스트', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const message = 'test message';

    appController.printEvent(message);
    expect(consoleSpy).toHaveBeenCalledWith('print:', message);
    consoleSpy.mockRestore();
  });

  describe('카프카 메시지 발행', () => {
    it('카프카 메시지가 지정한 topic으로 성공적으로 발행됩니다.', async () => {
      const topic = 'producer-test-topic';
      const messages = [{ key: 'testKey', value: 'testValue' }];

      try {
        const sendResult = await producer.send({ topic, messages });
        expect(sendResult).toBeDefined();
        expect(sendResult[0].topicName).toBe(topic);
      } catch (error) {
        console.error('메시지 발행 중 오류 발생:', error);
        throw error;
      }
    });
  });

  describe('카프카 메시지 소비', () => {
    it('동일한 topic의 메시지가 발행되면 성공적으로 소비합니다.', async () => {
      const topic = 'test-topic';
      const message = { key: 'testKey', value: 'testValue' };

      try {
        await consumer.subscribe({ topic, fromBeginning: true });
        await producer.send({
          topic,
          messages: [
            { key: message.key, value: JSON.stringify(message.value) },
          ],
        });

        const consumedMessages: Message[] = [];
        await new Promise<void>((resolve, reject) => {
          consumer
            .run({
              eachMessage: async ({ topic, partition, message }) => {
                consumedMessages.push({
                  key: message.key?.toString(),
                  value: JSON.parse(message.value?.toString() || ''),
                });
                resolve();
              },
            })
            .catch(reject);
        });

        expect(consumedMessages).toHaveLength(1);
        expect(consumedMessages[0].key).toBe(message.key);
        expect(consumedMessages[0].value).toBe(message.value);
      } catch (error) {
        console.error('메시지 소비 중 오류 발생:', error);
        throw error;
      } finally {
        await consumer.disconnect();
      }
    });
  });
});

// Kafka가 준비될 때까지 대기하는 함수
async function waitForKafka(brokers: string[]): Promise<void> {
  const kafka = new Kafka({ brokers });
  const admin = kafka.admin();
  let connected = false;
  while (!connected) {
    try {
      await admin.connect();
      await admin.listTopics();
      connected = true;
    } catch (e) {
      console.log('Waiting for Kafka to be ready...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      await admin.disconnect();
    }
  }
}
