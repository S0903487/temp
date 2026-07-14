import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

// Import the worker entry point
// Note: In worker/index.ts, the default export is a fetch handler.
import worker from './worker/index.js';

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'influenceos.db');

// Initialize local SQLite database
const dbExists = fs.existsSync(DB_PATH);
const sqliteDb = new Database(DB_PATH);

// If database is new, apply schema.sql
try {
  const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations'").get();
  if (!tables) {
    console.log('Initializing database schema...');
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    // Remove PRAGMA foreign_keys = ON; from start if needed, but better-sqlite3 handles it.
    sqliteDb.exec(schemaSql);
    console.log('Database schema initialized successfully!');
  }
} catch (err) {
  console.error('Error checking or initializing database schema:', err);
}

// Implement Cloudflare D1Database API compliant wrapper around better-sqlite3
class LocalD1PreparedStatement {
  private stmt: Database.Statement;
  private boundArgs: any[] = [];

  constructor(stmt: Database.Statement) {
    this.stmt = stmt;
  }

  bind(...args: any[]) {
    this.boundArgs = args.map(arg => {
      if (typeof arg === 'boolean') {
        return arg ? 1 : 0;
      }
      return arg === undefined ? null : arg;
    });
    return this;
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    try {
      const row = this.stmt.get(...this.boundArgs);
      if (!row) return null;
      if (colName) {
        return (row as any)[colName] ?? null;
      }
      return row as T;
    } catch (err) {
      console.error('Error running first() query:', err);
      throw err;
    }
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    try {
      const results = this.stmt.all(...this.boundArgs);
      return { results: results as T[] };
    } catch (err) {
      console.error('Error running all() query:', err);
      throw err;
    }
  }

  async run<T = any>(): Promise<{ success: boolean; meta: { changes: number } }> {
    try {
      const info = this.stmt.run(...this.boundArgs);
      return {
        success: true,
        meta: {
          changes: info.changes,
        }
      };
    } catch (err) {
      console.error('Error running run() query:', err);
      throw err;
    }
  }
}

class LocalD1Database {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  prepare(sql: string) {
    const stmt = this.db.prepare(sql);
    return new LocalD1PreparedStatement(stmt);
  }

  async batch(statements: LocalD1PreparedStatement[]) {
    // Cloudflare batch API stub (not heavily used in this app, but let's implement just in case)
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.all());
    }
    return results;
  }

  async exec(sql: string) {
    this.db.exec(sql);
    return { count: 0, duration: 0 };
  }
}

const localD1 = new LocalD1Database(sqliteDb);

async function startServer() {
  const app = express();

  // Parse JSON and raw bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Route API requests through the Cloudflare Worker handler
  app.all('/api/*any', async (req, res) => {
    try {
      const method = req.method;
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const headers = new Headers();

      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            headers.append(key, v);
          }
        } else {
          headers.set(key, value);
        }
      }

      let requestBody: any = undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
          requestBody = JSON.stringify(req.body);
        } else if (typeof req.body === 'string') {
          requestBody = req.body;
        }
      }

      // Construct a Fetch Request compatible with the worker
      const webRequest = new Request(fullUrl, {
        method,
        headers,
        body: requestBody,
      });

      // Execute worker's fetch
      const env = {
        DB: localD1 as any,
        ASSETS: {
          fetch: async () => new Response('Asset serving not handled by worker stub', { status: 404 }),
        } as any,
      };

      const webResponse = await worker.fetch(webRequest, env);

      // Write headers to express res
      res.status(webResponse.status);
      webResponse.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Write body to express res
      const bodyBuffer = await webResponse.arrayBuffer();
      res.send(Buffer.from(bodyBuffer));
    } catch (err: any) {
      console.error('API proxy error:', err);
      res.status(500).json({ error: 'Internal server error', details: err?.message });
    }
  });

  // Vite or Static Asset serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.join(process.cwd(), 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'frontend', 'dist');
    app.use(express.static(distPath));
    app.get('*any', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
