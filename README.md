# @mur-run/debug

> Debug utilities for Node.js applications with BitL Debug Bar integration.

[![npm version](https://img.shields.io/npm/v/@mur-run/debug.svg)](https://www.npmjs.com/package/@mur-run/debug)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Installation

```bash
npm install @mur-run/debug
# or
yarn add @mur-run/debug
# or
pnpm add @mur-run/debug
```

## Quick Start

```typescript
import { dump, dd } from '@mur-run/debug';

// Dump a value (continues execution)
dump({ user: 'John', age: 30 });
dump(myVariable, 'My Label');

// Dump and die (stops execution)
dd(someValue);
```

## Features

### dump(value, label?)

Send a value to BitL Debug Bar. Execution continues.

```typescript
import { dump } from '@mur-run/debug';

const user = { name: 'John', email: 'john@example.com' };
dump(user, 'Current User');

const items = [1, 2, 3, 4, 5];
dump(items);
```

### dd(value, label?)

Dump and die - sends a value and exits the process.

```typescript
import { dd } from '@mur-run/debug';

// Debug and stop here
dd(suspiciousValue, 'Check this!');

// Code below never runs
```

### logError(error, label?)

Log errors with full stack traces.

```typescript
import { logError } from '@mur-run/debug';

try {
  await riskyOperation();
} catch (error) {
  logError(error);
  // Handle error...
}
```

### logQuery(sql, bindings?, durationMs?)

Log database queries with timing.

```typescript
import { logQuery } from '@mur-run/debug';

// Manual logging
logQuery('SELECT * FROM users WHERE id = ?', [1], 12.5);

// With your ORM/Query builder
db.on('query', (query) => {
  logQuery(query.sql, query.bindings, query.duration);
});
```

### Express Middleware

Automatically log all HTTP requests.

```typescript
import express from 'express';
import { expressMiddleware } from '@mur-run/debug';

const app = express();

// Add early in middleware chain
app.use(expressMiddleware());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});
```

## Configuration

```typescript
import { configure } from '@mur-run/debug';

configure({
  host: '127.0.0.1',  // BitL debug server host
  port: 8765,         // BitL debug server port
  enabled: true,      // Enable/disable debugging
});

// Disable in production
configure({
  enabled: process.env.NODE_ENV !== 'production',
});
```

## Supported Types

The following types are serialized with special handling:

- **Primitives**: strings, numbers, booleans, null, undefined
- **Objects**: plain objects, class instances
- **Arrays**: with nested serialization
- **Errors**: with name, message, and stack trace
- **Dates**: ISO string representation
- **Maps & Sets**: converted to arrays
- **Buffers**: hex preview (first 100 bytes)
- **Functions**: `[Function: name]`
- **Symbols**: `Symbol(description)`
- **BigInt**: string with 'n' suffix

## Requirements

- Node.js 18+
- BitL app running with Debug Server enabled

## License

MIT
