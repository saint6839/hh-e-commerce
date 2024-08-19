import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { RecordMetadata } from 'kafkajs';
import { Observable } from 'rxjs';

@Controller()
export class AppController implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaClient.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

  @Get('/')
  getHello(): string {
    return 'health check 200';
  }

  /**
   * 카프카 메시지 발행 테스트용 엔드포인트
   * @param message 메시지
   * @returns 메시지 발행 결과
   */
  @Post('print')
  print(
    @Body() { message }: { message: string },
  ): Observable<RecordMetadata[]> {
    return this.kafkaClient.emit<RecordMetadata[]>('print', { value: message });
  }

  /**
   * 카프카 메시지 소비 테스트용 이벤트
   * @param message 메시지
   */
  @EventPattern('print')
  printEvent(@Payload() message: string): void {
    console.log('print:', message);
  }
}
