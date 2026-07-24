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

// Initialize local SQLite database with corruption recovery
function getDatabase(): Database.Database {
  try {
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    return db;
  } catch (err: any) {
    console.error('Corrupted or invalid database detected, recreating fresh database:', err?.message || err);
    try {
      if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
      if (fs.existsSync(`${DB_PATH}-wal`)) fs.unlinkSync(`${DB_PATH}-wal`);
      if (fs.existsSync(`${DB_PATH}-shm`)) fs.unlinkSync(`${DB_PATH}-shm`);
    } catch (e) {
      console.error('Failed to remove corrupted db files:', e);
    }
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    return db;
  }
}

const sqliteDb = getDatabase();

// If database is new, apply schema.sql
try {
  const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations'").get();
  if (!tables) {
    console.log('Initializing database schema...');
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    sqliteDb.exec(schemaSql);
    console.log('Database schema initialized successfully!');
  }
  
  // Ensure new columns are added if the database already existed
  const cols = sqliteDb.prepare("PRAGMA table_info(influencers)").all() as any[];
  const colNames = cols.map(c => c.name);
  if (!colNames.includes('profile_link')) {
    sqliteDb.exec("ALTER TABLE influencers ADD COLUMN profile_link TEXT;");
  }
  if (!colNames.includes('language')) {
    sqliteDb.exec("ALTER TABLE influencers ADD COLUMN language TEXT;");
  }
  if (!colNames.includes('roi')) {
    sqliteDb.exec("ALTER TABLE influencers ADD COLUMN roi REAL;");
  }
  if (!colNames.includes('cpa')) {
    sqliteDb.exec("ALTER TABLE influencers ADD COLUMN cpa REAL;");
  }
  if (!colNames.includes('cpi')) {
    sqliteDb.exec("ALTER TABLE influencers ADD COLUMN cpi REAL;");
  }
  if (!colNames.includes('ltv')) {
    sqliteDb.exec("ALTER TABLE influencers ADD COLUMN ltv REAL;");
  }

  // Ensure profile_image column is added to organizations table
  const orgCols = sqliteDb.prepare("PRAGMA table_info(organizations)").all() as any[];
  const orgColNames = orgCols.map(c => c.name);
  if (!orgColNames.includes('profile_image')) {
    sqliteDb.exec("ALTER TABLE organizations ADD COLUMN profile_image TEXT;");
  }

  // Ensure is_frozen column is added to users table
  const userCols = sqliteDb.prepare("PRAGMA table_info(users)").all() as any[];
  const userColNames = userCols.map(c => c.name);
  if (!userColNames.includes('is_frozen')) {
    sqliteDb.exec("ALTER TABLE users ADD COLUMN is_frozen INTEGER NOT NULL DEFAULT 0;");
  }
} catch (err) {
  console.error('Error checking or initializing database schema:', err);
}

// Implement Cloudflare D1Database API compliant wrapper around better-sqlite3
class LocalD1PreparedStatement {
  private stmt: Database.Statement;
  private boundArgs: any[] = [];

  sql: string;

  constructor(stmt: Database.Statement, sql: string) {
    this.stmt = stmt;
    this.sql = sql;
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
    return new LocalD1PreparedStatement(stmt, sql);
  }

  async batch(statements: LocalD1PreparedStatement[]) {
    const runInTransaction = this.db.transaction((stmts: LocalD1PreparedStatement[]) => {
      const results = [];
      for (const stmt of stmts) {
        const trimmed = stmt.sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
          results.push({ results: stmt.stmt.all(...stmt['boundArgs']) });
        } else {
          const info = stmt.stmt.run(...stmt['boundArgs']);
          results.push({ results: [], meta: { changes: info.changes } });
        }
      }
      return results;
    });
    return runInTransaction(statements);
  }

  async exec(sql: string) {
    this.db.exec(sql);
    return { count: 0, duration: 0 };
  }
}

class LocalKVNamespace {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiresAt = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const localD1 = new LocalD1Database(sqliteDb);
const localSessionsKV = new LocalKVNamespace();

async function startServer() {
  const app = express();

  // Parse JSON and raw bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Route API requests through the Cloudflare Worker handler
  app.use('/api', async (req, res) => {
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
        SESSIONS: localSessionsKV as any,
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
    const hmrOption = process.env.DISABLE_HMR === 'true' ? false : undefined;
    const vite = await createViteServer({
      root: path.join(process.cwd(), 'frontend'),
      server: {
        middlewareMode: true,
        hmr: hmrOption,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'frontend', 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
