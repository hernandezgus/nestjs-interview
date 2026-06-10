import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, originalUrl = request.url } = request;
    const startTime = Date.now();

    this.logger.log(`[Request] ${method} ${originalUrl}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `[Response] ${method} ${originalUrl} ${response.statusCode} - ${duration}ms`,
        );
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;
        const statusCode =
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          typeof error.status === 'number'
            ? error.status
            : 500;
        const errorName =
          error instanceof Error ? error.name : 'UnknownError';

        this.logger.error(
          `[Error] ${method} ${originalUrl} - ${statusCode} - ${errorName} - ${duration}ms`,
        );

        return throwError(() => error);
      }),
    );
  }
}
