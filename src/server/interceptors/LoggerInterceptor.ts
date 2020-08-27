import {
  Injectable, NestInterceptor,
  ExecutionContext, CallHandler,
  Logger,
} from '@nestjs/common';

import {Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly ctxPrefix: string = LoggerInterceptor.name;
  private readonly logger: Logger = new Logger(this.ctxPrefix);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const {statusCode} = context.switchToHttp().getResponse();
    const {
      originalUrl,
      method,
    } = req;

    const now = Date.now();
    const getLoggerContent = () => `${method} ${originalUrl} | total: ${Date.now() - now}ms | code: ${statusCode}`;

    return next
      .handle()
      .pipe(
        tap(() => {
          this.logger.log(getLoggerContent());
        }),
        catchError((err) => {
          this.logger.error(getLoggerContent());
          return throwError(err);
        }),
      );
  }
}
