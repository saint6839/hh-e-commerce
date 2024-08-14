import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import {
  ClientKafka,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { RecordMetadata } from 'kafkajs';
import { lastValueFrom, Observable } from 'rxjs';

@Controller()
export class AppController implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    const topics = ['sum', 'max'];
    topics.forEach((topic) => this.kafkaClient.subscribeToResponseOf(topic));
    await this.kafkaClient.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

  @Get('/')
  getHello(): string {
    return 'health check 200';
  }

  @Post('sum')
  sum(@Body() body: number[]): Observable<number> {
    return this.kafkaClient.send<number>('sum', { value: body });
  }

  @Post('max')
  async max(@Body() body: number[]): Promise<number> {
    const response = await lastValueFrom(
      this.kafkaClient.send<number>('max', { value: body }),
    );

    return response;
  }

  @Post('print')
  print(
    @Body() { message }: { message: string },
  ): Observable<RecordMetadata[]> {
    return this.kafkaClient.emit<RecordMetadata[]>('print', { value: message });
  }

  @MessagePattern('sum')
  replySum(@Payload() message: number[]): number {
    return message.reduce((a, b) => a + b);
  }

  @MessagePattern('max')
  replyMax(@Payload() message: number[]): number {
    return Math.max(...message);
  }

  @EventPattern('print')
  printEvent(@Payload() message: string): void {
    console.log('print:', message);
  }
}
