import { send, serialize } from '../client';

type Request = {
  method: string;
  url: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
  body?: unknown;
  ip?: string;
};

type Response = {
  statusCode: number;
  on(event: 'finish', listener: () => void): void;
};

type NextFunction = (err?: unknown) => void;

/**
 * Express middleware to log requests to BitL Debug Bar.
 * 
 * @example
 * ```ts
 * import express from 'express';
 * import { expressMiddleware } from '@bitl/debug';
 * 
 * const app = express();
 * 
 * // Add early in middleware chain
 * app.use(expressMiddleware());
 * 
 * // Your routes...
 * app.get('/', (req, res) => res.send('Hello'));
 * ```
 */
export function expressMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      send({
        type: 'request',
        content: serialize({
          method: req.method,
          url: req.url,
          path: req.path,
          status: res.statusCode,
          duration,
          headers: sanitizeHeaders(req.headers),
          query: req.query,
          body: sanitizeBody(req.body),
          ip: req.ip,
        }),
        label: `${req.method} ${req.path}`,
      }).catch(() => {
        // Ignore errors
      });
    });

    next();
  };
}

/**
 * Remove sensitive headers from logs.
 */
function sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[] | undefined> {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const result: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Sanitize request body for logging.
 */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'secret', 'token', 'api_key', 'apiKey'];
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }

  return result;
}
