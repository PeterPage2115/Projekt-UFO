import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/ufo.db';
const resolvedPath = path.resolve(dbPath);

// Ensure data directory exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(resolvedPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Auto-create tables if they don't exist
function runMigrations(db: InstanceType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fetched_at TEXT NOT NULL,
      village_count INTEGER,
      player_count INTEGER,
      alliance_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS villages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL REFERENCES snapshots(id),
      map_id INTEGER NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      tid INTEGER,
      vid INTEGER,
      name TEXT,
      uid INTEGER,
      player_name TEXT,
      aid INTEGER,
      alliance_name TEXT,
      population INTEGER,
      region TEXT,
      is_capital INTEGER,
      is_city INTEGER,
      has_harbor INTEGER,
      victory_points INTEGER
    );

    CREATE TABLE IF NOT EXISTS players (
      uid INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      tid INTEGER,
      aid INTEGER,
      alliance_name TEXT,
      total_pop INTEGER DEFAULT 0,
      village_count INTEGER DEFAULT 0,
      first_seen_at TEXT,
      last_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS alliances (
      aid INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      member_count INTEGER DEFAULT 0,
      total_pop INTEGER DEFAULT 0,
      first_seen_at TEXT,
      last_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      travian_uid INTEGER,
      travian_villages TEXT,
      created_at TEXT,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS operations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      landing_time TEXT,
      description TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_targets (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
      target_x INTEGER NOT NULL,
      target_y INTEGER NOT NULL,
      target_village_name TEXT,
      target_player_name TEXT,
      is_real INTEGER DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS operation_assignments (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES operation_targets(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      source_x INTEGER,
      source_y INTEGER,
      source_village_name TEXT,
      unit_speed REAL,
      waves INTEGER DEFAULT 1,
      send_time TEXT,
      travel_time REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS defense_calls (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      target_x INTEGER NOT NULL,
      target_y INTEGER NOT NULL,
      target_village_name TEXT,
      target_player_name TEXT,
      impact_time TEXT,
      wave_delay INTEGER,
      requested_inf_def INTEGER,
      requested_cav_def INTEGER,
      description TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS defense_responses (
      id TEXT PRIMARY KEY,
      defense_call_id TEXT NOT NULL REFERENCES defense_calls(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      source_x INTEGER,
      source_y INTEGER,
      source_village_name TEXT,
      troops TEXT,
      inf_def_value INTEGER,
      cav_def_value INTEGER,
      send_time TEXT,
      status TEXT NOT NULL DEFAULT 'pledged',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS troop_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      village_x INTEGER,
      village_y INTEGER,
      village_name TEXT,
      troop_type TEXT,
      troops TEXT,
      off_value INTEGER,
      def_inf_value INTEGER,
      def_cav_value INTEGER,
      reported_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS bug_reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      steps TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'new',
      page TEXT,
      reported_by TEXT REFERENCES users(id),
      resolved_by TEXT REFERENCES users(id),
      admin_notes TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

runMigrations(sqlite);

// Check if snapshots exist and auto-fetch if needed
function autoFetchIfNeeded() {
  const result = sqlite.prepare('SELECT COUNT(*) as count FROM snapshots').get() as { count: number };
  if (result.count === 0) {
    console.log('[db] No snapshots found, scheduling auto-fetch...');
    // Use dynamic import to avoid circular dependency
    setTimeout(async () => {
      try {
        const { collectAndStore } = await import('../map-sql/collector');
        console.log('[db] Auto-fetching initial map.sql snapshot...');
        const result = await collectAndStore();
        console.log(`[db] Auto-fetch complete: snapshot #${result.snapshotId}, ${result.villageCount} villages`);
      } catch (error) {
        console.error('[db] Auto-fetch failed:', error instanceof Error ? error.message : error);
      }
    }, 3000);
  }

  // Start the scheduler
  setTimeout(async () => {
    try {
      const { startScheduler } = await import('../map-sql/scheduler');
      startScheduler();
    } catch (error) {
      console.error('[db] Failed to start scheduler:', error instanceof Error ? error.message : error);
    }
  }, 5000);
}

autoFetchIfNeeded();

export const db = drizzle(sqlite, { schema });
export type Database = typeof db;
