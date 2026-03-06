import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

let dbInstance: Database.Database | null = null;

function getDatabasePath(): string {
  return process.env.DATABASE_PATH || "./data/app.db";
}

export function initDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  const dataDir = path.dirname(absoluteDbPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  dbInstance = new Database(absoluteDbPath);
  const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  dbInstance.exec(schemaSql);

  return dbInstance;
}

export function getDb(): Database.Database {
  return initDb();
}
