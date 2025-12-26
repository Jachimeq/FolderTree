export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found', code = 'NOT_FOUND') {
    super(message, 404, code);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, code);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(message, 500, code);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
