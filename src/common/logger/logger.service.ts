import { ConsoleLogger, Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class LoggerService extends ConsoleLogger {
  error(message: string, trace: string) {
    super.error(message, trace);
  }

  warn(message: string, context?: string) {
    if (context) {
      super.warn(message, context);
    } else {
      super.warn(message);
    }
  }

  /**
   * info 와 동일한 레벨의 로그
   */
  log(message: string, context?: string | object) {
    if (context) {
      super.log(message, context);
    } else {
      super.log(message);
    }
  }

  debug(message: string, context?: string) {
    if (context) {
      super.debug(message, context);
    } else {
      super.debug(message);
    }
  }

  verbose(message: string, context?: string) {
    if (context) {
      super.verbose(message, context);
    } else {
      super.verbose(message);
    }
  }
}
