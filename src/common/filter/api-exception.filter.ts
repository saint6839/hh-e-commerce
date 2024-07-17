import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { LogLevel } from 'typeorm';
import { ApiResponseDto } from '../api/api-response.dto';

@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : 'Internal Server Error';

    const errorResponse = new ApiResponseDto(
      false,
      typeof message === 'string' ? message : (message as any).message,
    );

    this.loggingExceptionHandling(request, status, errorResponse, exception);
    response.status(status).json(errorResponse);
  }

  /**
   * 클라이언트측의 오류는 상대적으로 오류의 중요도가 낮다고 판단하여 warn 로깅
   * 서버측의 오류는 상대적으로 오류의 중요도가 높다고 판단하여 error 로깅
   */
  private loggingExceptionHandling(
    request: any,
    status: number,
    errorResponse: ApiResponseDto<any>,
    exception: any,
  ) {
    const logMessage = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      error: errorResponse,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
    };

    const logLevel = this.getLogLevel(status);
    const exceptionStack = exception instanceof Error ? exception.stack : '';
    this.logger[logLevel](logMessage, exceptionStack);
  }

  private getLogLevel(status: number): LogLevel {
    if (status >= 500) {
      return 'error';
    }
    if (status >= 400) {
      return 'warn';
    }
    return 'error';
  }

  /**
   * 헤더에 민감 정보 포함되어있을 경우 제외하고 로깅하도록 처리
   * 우선은 없으므로 메서드만 정의
   * @param headers
   * @returns
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    return sanitized;
  }

  /**
   * 바디에 민감 정보 포함되어있을 경우 제외하고 로깅하도록 처리
   * 우선은 없으므로 메서드만 정의
   * @param body
   * @returns
   */
  private sanitizeBody(body: any): any {
    const sanitized = { ...body };
    return sanitized;
  }
}
