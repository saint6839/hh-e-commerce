import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { ExternalDataPlatformService } from './../../../src/common/data-platform/external-data-platform.service';
import { LoggerService } from './../../../src/common/logger/logger.service';
import { IOutboxRepositoryToken } from './../../../src/common/outbox/domain/interface/outbox.repository.interface';
import { PaymentCompletedListener } from './../../../src/payment/listener/payment-completed.listener';

describe('PaymentCompletedListener', () => {
  let listener: PaymentCompletedListener;
  let kafkaContainer: StartedKafkaContainer;
  let producer: Producer;
  let consumer: Consumer;

  const mockExternalDataPlatformService = {
    saveOrderData: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockOutboxRepository = {
    findByEventTypeAndPayload: jest.fn(),
    markAsPublished: jest.fn(),
  };

  const mockClientKafka = {
    emit: jest.fn(),
  };

  beforeAll(async () => {
    jest.setTimeout(60000);
    kafkaContainer = await new KafkaContainer().start();
    const kafkaHost = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;

    const kafka = new Kafka({
      clientId: 'test-client',
      brokers: [kafkaHost],
    });

    producer = kafka.producer();
    await producer.connect();

    consumer = kafka.consumer({ groupId: 'test-group' });
    await consumer.connect();

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
      topics: [{ topic: 'payment.completed' }],
    });
    await admin.disconnect();

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Kafka setup completed');
  }, 60000);

  afterAll(async () => {
    await producer.disconnect();
    await consumer.disconnect();
    await kafkaContainer.stop();
  }, 30000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentCompletedListener,
        {
          provide: ExternalDataPlatformService,
          useValue: mockExternalDataPlatformService,
        },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: IOutboxRepositoryToken, useValue: mockOutboxRepository },
        { provide: 'PAYMENT_SERVICE', useValue: mockClientKafka },
      ],
    }).compile();

    listener = module.get<PaymentCompletedListener>(PaymentCompletedListener);

    await consumer.subscribe({
      topic: 'payment.completed',
      fromBeginning: true,
    });

    // 리스너 실행
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log('Received message:', message.value?.toString());
        await listener.handle(JSON.parse(message.value?.toString() || '{}'));
      },
    });

    console.log('Listener setup completed');
  });

  it('payment.completed 이벤트를 성공적으로 처리하는지 테스트', async () => {
    //given
    const event = {
      orderId: '123',
      userId: 'user1',
      amount: 1000,
      status: 'completed',
    };

    mockExternalDataPlatformService.saveOrderData.mockResolvedValue(undefined);
    mockOutboxRepository.findByEventTypeAndPayload.mockResolvedValue({
      id: 'outbox1',
    });

    //when
    await producer.send({
      topic: 'payment.completed',
      messages: [{ value: JSON.stringify(event) }],
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    //then
    expect(mockExternalDataPlatformService.saveOrderData).toHaveBeenCalledWith(
      expect.objectContaining(event),
    );
    expect(mockOutboxRepository.markAsPublished).toHaveBeenCalledWith(
      'outbox1',
    );
    expect(mockLoggerService.log).toHaveBeenCalledWith(
      expect.stringContaining('주문 정보 외부 저장 성공'),
      PaymentCompletedListener.name,
    );
  }, 30000);
});
