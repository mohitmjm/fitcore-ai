/**
 * Typed application error. Carries a stable `code` (clients switch on this, not the message —
 * important for i18n + mobile) and an HTTP `status`. See docs/architecture/04 §3.1.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const Errors = {
  unauthenticated: () => new AppError('UNAUTHENTICATED', 'Sign in required', 401),
  forbidden: (message = 'You do not have access to this resource') =>
    new AppError('FORBIDDEN', message, 403),
  notFound: (what = 'Resource') => new AppError('NOT_FOUND', `${what} not found`, 404),
  planLimit: (message = 'Upgrade your plan to use this feature') =>
    new AppError('PLAN_LIMIT', message, 402),
  config: (message: string) => new AppError('CONFIG', message, 500),
};
