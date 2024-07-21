import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}
  private readonly RESPONSE_TIME_THRESHOLD = 1000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, headers } = req;
    const now = Date.now();

    // request logging
    this.loggingRequest(method, url, headers, body);

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        const logMessage = `${method} ${url} ${statusCode} ${responseTime}ms`;
        // response logging
        this.loggingResponse(responseTime, logMessage, data);
      }),
    );
  }

  /**
   * 특정 요청의 응답 시간이 기준치를 넘어가면 warn 로깅, 그 외에는 info 로깅
   */
  private loggingResponse(responseTime: number, logMessage: string, data: any) {
    if (responseTime > this.RESPONSE_TIME_THRESHOLD) {
      this.logger.warn(
        `Slow response: ${logMessage}`,
        HttpLoggerInterceptor.name,
      );
    } else {
      this.logger.log(logMessage, HttpLoggerInterceptor.name);
    }
    this.logger.debug(
      `Response Body: ${JSON.stringify(data)}`,
      HttpLoggerInterceptor.name,
    );
  }

  private loggingRequest(method: any, url: any, headers: any, body: any) {
    this.logger.log(`Request - ${method} ${url}`, 'HttpLoggerInterceptor');
    this.logger.debug(
      `Request Headers: ${JSON.stringify(headers)}`,
      HttpLoggerInterceptor.name,
    );
    this.logger.debug(
      `Request Body: ${JSON.stringify(body)}`,
      HttpLoggerInterceptor.name,
    );
  }
}
