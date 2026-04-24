import type { components } from './schema.js';

export type AdzunaExceptionBody = components['schemas']['Exception'];

export class AdzunaError extends Error {
  readonly status: number;
  readonly exception: string;
  readonly display: string | undefined;
  readonly doc: string | undefined;

  constructor(status: number, body: AdzunaExceptionBody) {
    super(body.display ?? body.exception);
    this.name = 'AdzunaError';
    this.status = status;
    this.exception = body.exception;
    this.display = body.display;
    this.doc = body.doc;
  }
}
