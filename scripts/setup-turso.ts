// Script to initialize Turso database tables
// Run with: npx tsx scripts/setup-turso.ts

import { createClient } from "@libsql/client";

async function setupDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("TURSO_DATABASE_URL environment variable is required");
    console.log("\nTo set up Turso:");
    console.log("1. Install Turso CLI: curl -sSfL https://get.tur.so/install.sh | bash");
    console.log("2. Sign up: turso auth signup");
    console.log("3. Create database: turso db create donation-tracker");
    console.log("4. Get URL: turso db show donation-tracker --url");
    console.log("5. Create token: turso db tokens create donation-tracker");
    console.log("\nThen set environment variables:");
    console.log("  TURSO_DATABASE_URL=libsql://your-db.turso.io");
    console.log("  TURSO_AUTH_TOKEN=your-token");
    process.exit(1);
  }

  const client = createClient({
    url,
    authToken,
  });

  console.log("Setting up Turso database...");

  try {
    // Create users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        email_verified INTEGER,
        image TEXT,
        username TEXT UNIQUE,
        pin_hash TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    console.log("Users table created");

    // Create accounts table (for OAuth)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
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
      )
    `);
    console.log("Accounts table created");

    // Create sessions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        expires INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Sessions table created");

    // Create verification tokens table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires INTEGER NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `);
    console.log("Verification tokens table created");

    // Create donations table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        description TEXT NOT NULL,
        organization TEXT NOT NULL,
        amount REAL NOT NULL,
        donation_date TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Donations table created");

    // Verify tables exist
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    console.log("\nTables in database:");
    tables.rows.forEach((row) => {
      console.log(`   - ${row.name}`);
    });

    console.log("\nDatabase setup complete!");

  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
