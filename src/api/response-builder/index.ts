import { Response } from 'express';

export interface ApiResponseBody<T = unknown> {
  error: number;
  data: T | null;
  message: string;
}

function send<T>(res: Response, statusCode: number, body: ApiResponseBody<T>): void {
  res.status(statusCode).send(body);
}

export function success<T>(res: Response, data: T, message?: string): void {
  send(res, 200, { error: 0, data, message: message ?? 'Success' });
}

export function created<T>(res: Response, data: T, message?: string): void {
  send(res, 201, { error: 0, data, message: message ?? 'Created successfully' });
}

export function badRequest(res: Response, message: string): void {
  send(res, 400, { error: 1, data: null, message });
}

export function unauthorized(res: Response, message?: string): void {
  send(res, 401, { error: 1, data: null, message: message ?? 'Unauthorized' });
}

export function forbidden(res: Response, message?: string): void {
  send(res, 403, { error: 1, data: null, message: message ?? 'Forbidden' });
}

export function notFound(res: Response, message?: string): void {
  send(res, 404, { error: 1, data: null, message: message ?? 'Not found' });
}

export function conflict(res: Response, message: string): void {
  send(res, 409, { error: 1, data: null, message });
}

export function internalError(res: Response, message?: string): void {
  send(res, 500, { error: 1, data: null, message: message ?? 'Internal server error' });
}

export const respond = { send, success, created, badRequest, unauthorized, forbidden, notFound, conflict, internalError };
