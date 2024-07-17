import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
  error(message: string, trace: string) {
    super.error(message, trace);
  }

  warn(message: string) {
    super.warn(message);
  }

  /**
   * info 와 동일한 레벨의 로그
   */
  log(message: string, context?: string) {
    if (context) {
      super.log(message, context);
    } else {
      super.log(message);
    }
  }

  debug(message: string) {
    super.debug(message);
  }

  verbose(message: string) {
    super.verbose(message);
  }
}
