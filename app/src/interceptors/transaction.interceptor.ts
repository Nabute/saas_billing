import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { DataSource } from 'typeorm';
import { mergeMap } from 'rxjs/operators';

/**
 * TransactionInterceptor handles wrapping each HTTP request in a database transaction.
 * This ensures that all database operations within a single request are either
 * fully completed or fully rolled back, maintaining atomicity.
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  /**
   * Constructor to inject the TypeORM data source.
   * @param {DataSource} dataSource - The TypeORM data source instance to manage transactions.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Intercepts the execution context (HTTP request) and wraps it in a database transaction.
   *
   * @param {ExecutionContext} context - The current execution context of the request.
   * @param {CallHandler} next - The next handler in the request pipeline.
   * @returns {Observable<any>} - The resulting observable after the transaction is applied.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Begin a new transaction using the TypeORM data source.
    return from(
      this.dataSource.transaction(async (manager) => {
        // Attach the transaction manager to the request object for use in downstream services.
        request.transactionManager = manager;
        // Return the observable directly from the next.handle() method.
        return next.handle().toPromise();
      }),
    ).pipe(
      // Use mergeMap to ensure the final result is an observable that can handle inner observables.
      mergeMap((result) => {
        // If result is null or undefined, provide a fallback to avoid the error.
        if (result === null || result === undefined) {
          return from([null]);
        }
        return from([result]);
      }),
    );
  }
}
