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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, headers } = req;
    const now = Date.now();

    // request logging
    this.logger.log(`Request - ${method} ${url}`, 'HttpLoggerInterceptor');
    this.logger.debug(
      `Request Headers: ${JSON.stringify(headers)}`,
      HttpLoggerInterceptor.name,
    );
    this.logger.debug(
      `Request Body: ${JSON.stringify(body)}`,
      HttpLoggerInterceptor.name,
    );

    // response logging
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const responseTime = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${statusCode} ${responseTime}ms`,
          HttpLoggerInterceptor.name,
        );
        this.logger.debug(
          `Response Body: ${JSON.stringify(data)}`,
          HttpLoggerInterceptor.name,
        );
      }),
    );
  }
}
