import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

// Check if we're using Turso (production) or local SQLite (development)
const isProduction = process.env.TURSO_DATABASE_URL;

let db: ReturnType<typeof drizzle>;

const SQL_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    email_verified INTEGER,
    image TEXT,
    username TEXT UNIQUE,
    pin_hash TEXT,
    security_question TEXT,
    security_answer_hash TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    session_token TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    expires INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires INTEGER NOT NULL,
    PRIMARY KEY (identifier, token)
  )`,
  `CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    organization TEXT NOT NULL,
    amount REAL NOT NULL,
    donation_date TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
];

// Migrations that may fail if already applied (e.g. ADD COLUMN on existing table)
const MIGRATIONS = [
  `ALTER TABLE users ADD COLUMN security_question TEXT`,
  `ALTER TABLE users ADD COLUMN security_answer_hash TEXT`,
];

async function initDatabase(client: Client) {
  for (const sql of SQL_TABLES) {
    await client.execute(sql);
  }
  for (const sql of MIGRATIONS) {
    try {
      await client.execute(sql);
    } catch {
      // Column likely already exists — safe to ignore
    }
  }
}

if (isProduction) {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db = drizzle(client, { schema });
  initDatabase(client);
} else {
  const client = createClient({
    url: "file:donation-tracker.db",
  });
  db = drizzle(client, { schema });
  initDatabase(client);
}

export { db };
