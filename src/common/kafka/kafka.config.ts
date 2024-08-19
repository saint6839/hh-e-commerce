import { ConfigService } from '@nestjs/config';
import { ClientsModuleAsyncOptions, Transport } from '@nestjs/microservices';

export const getKafkaConfig = (): ClientsModuleAsyncOptions => [
  {
    name: 'KAFKA_CLIENT',
    useFactory: (configService: ConfigService) => ({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: configService.get('KAFKA_CLIENT_ID', 'my-app'),
          brokers: [configService.get('KAFKA_BROKER', 'localhost:29092')],
        },
        consumer: {
          groupId: configService.get(
            'KAFKA_CONSUMER_GROUP',
            'my-consumer-group',
          ),
        },
      },
    }),
    inject: [ConfigService],
  },
];
