// src/utils/errors.ts
export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string) {
    super(message, 429);
  }
}

export class NetworkError extends BaseError {
  public readonly networkType: string;

  constructor(message: string, networkType: string) {
    super(message, 502);
    this.networkType = networkType;
  }
}

export class XanoServiceError extends BaseError {
  constructor(message: string) {
    super(message, 503);
  }
}

export class ExternalServiceError extends BaseError {
  public readonly service: string;

  constructor(message: string, service: string) {
    super(message, 502);
    this.service = service;
  }
}