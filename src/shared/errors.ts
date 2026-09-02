export type AppErrorCode =
  | 'ValidationError'
  | 'NetworkError'
  | 'TimeoutError'
  | 'ImportError'
  | 'ExecutionError'
  | 'StorageError'
  | 'OpenApiError'
  | 'TestAssertionError'
  | 'UnknownError';

export interface AppErrorShape {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly cause?: unknown;
  readonly context?: Readonly<Record<string, unknown>>;
}

export class AppError extends Error implements AppErrorShape {
  readonly code: AppErrorCode;
  readonly context?: Readonly<Record<string, unknown>>;
  override readonly cause?: unknown;

  constructor(shape: AppErrorShape) {
    super(shape.message);
    this.name = shape.code;
    this.code = shape.code;
    this.cause = shape.cause;
    this.context = shape.context;
  }

  toUserMessage(): string {
    switch (this.code) {
      case 'ValidationError':
        return `Validation: ${this.message}`;
      case 'NetworkError':
        return `Network problem: ${this.message}`;
      case 'TimeoutError':
        return `Request timed out: ${this.message}`;
      case 'ImportError':
        return `Import failed: ${this.message}`;
      case 'ExecutionError':
        return `Execution failed: ${this.message}`;
      case 'StorageError':
        return `Storage error: ${this.message}`;
      case 'OpenApiError':
        return `OpenAPI error: ${this.message}`;
      case 'TestAssertionError':
        return `Assertion failed: ${this.message}`;
      default:
        return this.message;
    }
  }
}

export function toAppError(err: unknown, fallbackCode: AppErrorCode = 'UnknownError'): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError({ code: fallbackCode, message: err.message, cause: err });
  }
  return new AppError({ code: fallbackCode, message: String(err) });
}