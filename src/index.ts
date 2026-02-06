import { send, serialize, configure, isEnabled, BitLClientOptions } from './client';

export { configure, isEnabled, BitLClientOptions };

/**
 * Get the caller's file and line number.
 */
function getCallerInfo(): { file?: string; line?: number } {
  const stack = new Error().stack;
  if (!stack) return {};

  const lines = stack.split('\n');
  // Skip Error, getCallerInfo, dump/dd
  const callerLine = lines[3];
  if (!callerLine) return {};

  // Parse "    at functionName (file:line:col)" or "    at file:line:col"
  const match = callerLine.match(/at\s+(?:.*?\s+\()?(.+?):(\d+):\d+\)?/);
  if (match) {
    return {
      file: match[1].replace(process.cwd() + '/', ''),
      line: parseInt(match[2], 10),
    };
  }
  return {};
}

/**
 * Dump a value to BitL Debug Bar.
 * 
 * @example
 * ```ts
 * import { dump } from '@bitl/debug';
 * 
 * dump({ user: 'John', age: 30 });
 * dump(myVariable, 'My Label');
 * ```
 */
export function dump(value: unknown, label?: string): void {
  const caller = getCallerInfo();
  
  send({
    type: 'dump',
    content: serialize(value),
    label,
    ...caller,
  }).catch(() => {
    // Ignore errors
  });
}

/**
 * Dump a value and die (exit the process).
 * 
 * @example
 * ```ts
 * import { dd } from '@bitl/debug';
 * 
 * dd({ user: 'John', age: 30 }); // Dumps and exits
 * ```
 */
export function dd(value: unknown, label?: string): never {
  const caller = getCallerInfo();
  
  // Send synchronously before exiting
  send({
    type: 'dump',
    content: serialize(value),
    label: label ?? '🛑 dd()',
    ...caller,
  }).finally(() => {
    process.exit(1);
  });

  // TypeScript needs this, but it will never be reached
  throw new Error('dd() called');
}

/**
 * Log an error to BitL Debug Bar.
 * 
 * @example
 * ```ts
 * import { logError } from '@bitl/debug';
 * 
 * try {
 *   // ...
 * } catch (error) {
 *   logError(error);
 * }
 * ```
 */
export function logError(error: Error | unknown, label?: string): void {
  const caller = getCallerInfo();
  
  const errorData = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n'),
      }
    : { message: String(error) };

  send({
    type: 'error',
    content: serialize(errorData),
    label: label ?? (error instanceof Error ? error.name : 'Error'),
    ...caller,
  }).catch(() => {
    // Ignore errors
  });
}

/**
 * Log a warning to BitL Debug Bar.
 */
export function logWarning(message: string, context?: unknown): void {
  const caller = getCallerInfo();
  
  send({
    type: 'warning',
    content: serialize({ message, context }),
    ...caller,
  }).catch(() => {
    // Ignore errors
  });
}

/**
 * Log a database query to BitL Debug Bar.
 * 
 * @example
 * ```ts
 * import { logQuery } from '@bitl/debug';
 * 
 * logQuery('SELECT * FROM users WHERE id = ?', [1], 12.5);
 * ```
 */
export function logQuery(sql: string, bindings?: unknown[], durationMs?: number): void {
  const caller = getCallerInfo();
  
  send({
    type: 'query',
    content: serialize({
      sql,
      bindings,
      duration: durationMs,
    }),
    ...caller,
  }).catch(() => {
    // Ignore errors
  });
}

// Re-export middleware
export { expressMiddleware } from './middleware/express';
