import http from 'http';

export interface DumpPayload {
  type: 'dump' | 'error' | 'warning' | 'query' | 'request';
  content: unknown;
  label?: string;
  file?: string;
  line?: number;
  timestamp: string;
  language: 'node';
}

export interface BitLClientOptions {
  host?: string;
  port?: number;
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<BitLClientOptions> = {
  host: '127.0.0.1',
  port: 8765,
  enabled: true,
};

let globalOptions: Required<BitLClientOptions> = { ...DEFAULT_OPTIONS };

/**
 * Configure the BitL debug client.
 */
export function configure(options: BitLClientOptions): void {
  globalOptions = { ...DEFAULT_OPTIONS, ...options };
}

/**
 * Check if BitL debugging is enabled.
 */
export function isEnabled(): boolean {
  return globalOptions.enabled;
}

/**
 * Get the caller's file and line number.
 */
function getCallerInfo(): { file?: string; line?: number } {
  const stack = new Error().stack;
  if (!stack) return {};

  const lines = stack.split('\n');
  // Skip Error, getCallerInfo, send, dump/dd
  const callerLine = lines[4];
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
 * Send a payload to the BitL debug server.
 */
export function send(payload: Omit<DumpPayload, 'timestamp' | 'language'>): Promise<void> {
  if (!globalOptions.enabled) {
    return Promise.resolve();
  }

  const fullPayload: DumpPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
    language: 'node',
  };

  return new Promise((resolve) => {
    const data = JSON.stringify(fullPayload);

    const req = http.request(
      {
        hostname: globalOptions.host,
        port: globalOptions.port,
        path: '/dump',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 1000,
      },
      () => resolve()
    );

    req.on('error', () => {
      // Silently ignore connection errors (BitL not running)
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      resolve();
    });

    req.write(data);
    req.end();
  });
}

/**
 * Serialize a value for debugging.
 */
export function serialize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  if (typeof value === 'bigint') {
    return value.toString() + 'n';
  }

  if (value instanceof Error) {
    return {
      __type: 'Error',
      name: value.name,
      message: value.message,
      stack: value.stack?.split('\n'),
    };
  }

  if (value instanceof Date) {
    return {
      __type: 'Date',
      value: value.toISOString(),
    };
  }

  if (value instanceof Map) {
    return {
      __type: 'Map',
      entries: Array.from(value.entries()).map(([k, v]) => [serialize(k), serialize(v)]),
    };
  }

  if (value instanceof Set) {
    return {
      __type: 'Set',
      values: Array.from(value).map(serialize),
    };
  }

  if (Buffer.isBuffer(value)) {
    return {
      __type: 'Buffer',
      length: value.length,
      preview: value.slice(0, 100).toString('hex'),
    };
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serialize(v);
    }
    return result;
  }

  return value;
}
