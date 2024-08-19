import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { IOutboxRepositoryToken } from '../../../src/common/outbox/domain/interface/outbox.repository.interface';
import { IAccumulatePopularProductsSoldUseCaseToken } from '../../../src/product/domain/interface/usecase/accumulate-popular-proudcts-sold.usecase.interface';
import { AccumulatePopularProductsSoldListener } from '../../../src/product/listener/accumulate-popular-products.listener';

describe('AccumulatePopularProductsSoldListener', () => {
  let listener: AccumulatePopularProductsSoldListener;
  let kafkaContainer: StartedKafkaContainer;
  let producer: Producer;
  let consumer: Consumer;
  let kafkaHost: string;
  const mockAccumulatePopularProductsSoldUseCase = {
    execute: jest.fn(),
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
    kafkaHost = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;

    const kafka = new Kafka({
      clientId: 'test-client',
      brokers: [kafkaHost],
    });

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
      topics: [{ topic: 'product.popular.accumulate' }],
    });
    await admin.disconnect();

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Kafka setup completed');
  }, 60000);

  beforeEach(async () => {
    const kafka = new Kafka({
      clientId: 'test-client',
      brokers: [kafkaHost],
    });

    producer = kafka.producer();
    await producer.connect();

    consumer = kafka.consumer({ groupId: 'test-group' });
    await consumer.connect();

    await consumer.subscribe({
      topic: 'product.popular.accumulate',
      fromBeginning: true,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccumulatePopularProductsSoldListener,
        {
          provide: IAccumulatePopularProductsSoldUseCaseToken,
          useValue: mockAccumulatePopularProductsSoldUseCase,
        },
        { provide: IOutboxRepositoryToken, useValue: mockOutboxRepository },
        { provide: 'PRODUCT_SERVICE', useValue: mockClientKafka },
      ],
    }).compile();

    listener = module.get<AccumulatePopularProductsSoldListener>(
      AccumulatePopularProductsSoldListener,
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log('Received message:', message.value?.toString());
        await listener.handle(JSON.parse(message.value?.toString() || '{}'));
      },
    });

    console.log('Listener setup completed');
  });

  afterEach(async () => {
    await producer.disconnect();
    await consumer.disconnect();
  });

  it('인기 상품 판매량 누적 이벤트를 성공적으로 처리해야 함', async () => {
    //given
    const event = {
      orderItems: [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ],
    };

    mockAccumulatePopularProductsSoldUseCase.execute.mockResolvedValue(
      undefined,
    );
    mockOutboxRepository.findByEventTypeAndPayload.mockResolvedValue({
      id: 'outbox1',
    });

    //when
    await producer.send({
      topic: 'product.popular.accumulate',
      messages: [{ value: JSON.stringify(event) }],
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    //then
    expect(
      mockAccumulatePopularProductsSoldUseCase.execute,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ orderItems: event.orderItems }),
    );
    expect(mockOutboxRepository.markAsPublished).toHaveBeenCalledWith(
      'outbox1',
    );
  }, 30000);

  it('최대 재시도 횟수 초과 시 Slack 알림을 보내야 함', async () => {
    //given
    const event = {
      orderItems: [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ],
    };

    let callCount = 0;
    mockAccumulatePopularProductsSoldUseCase.execute.mockImplementation(() => {
      callCount++;
      if (callCount <= 3) {
        return Promise.reject(new Error('테스트 에러'));
      }
      return Promise.resolve();
    });

    mockOutboxRepository.findByEventTypeAndPayload.mockResolvedValue(null);

    //when
    await producer.send({
      topic: 'product.popular.accumulate',
      messages: [{ value: JSON.stringify(event) }],
    });

    await new Promise((resolve) => setTimeout(resolve, 15000));

    //then
    expect(mockClientKafka.emit).toHaveBeenCalledWith(
      'slack.notification',
      expect.objectContaining({
        channel: '#error-alerts',
        text: expect.stringContaining(
          'Error in AccumulatePopularProductsSoldListener',
        ),
      }),
    );
  }, 30000);
});
