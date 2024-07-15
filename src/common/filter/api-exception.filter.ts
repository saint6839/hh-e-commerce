import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  LoggerService,
} from '@nestjs/common';
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

    const logMessage = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      error: errorResponse,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
    };

    this.logger.error(JSON.stringify(logMessage), exception.stack);

    response.status(status).json(errorResponse);
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
