import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Standard SQLite recommendation for UTF-8 and performance
db.pragma('encoding = "UTF-8"');
db.pragma('journal_mode = WAL');

// POSTGRES-COMPATIBLE SCHEMA
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leagues (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    country TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS global_teams (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    league_id TEXT REFERENCES leagues(id),
    logo_url TEXT,
    stadium_name TEXT,
    city TEXT,
    foundation_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS global_players (
    id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES global_teams(id),
    name TEXT NOT NULL,
    number INTEGER,
    position TEXT,
    avatar_url TEXT,
    is_starting INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    home_formation TEXT,
    away_formation TEXT,
    is_dual_team INTEGER DEFAULT 0,
    team_colors TEXT,
    ui_config TEXT,
    players TEXT,
    drawings TEXT,
    owner_id TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recordings (
    id TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id),
    title TEXT,
    video_url TEXT,
    file_size INTEGER,
    duration INTEGER,
    media_type TEXT DEFAULT 'RAW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration for existing databases
try {
  db.exec('ALTER TABLE teams ADD COLUMN owner_id TEXT REFERENCES users(id)');
} catch (e) {}

try {
  db.exec('ALTER TABLE recordings ADD COLUMN media_type TEXT DEFAULT "RAW"');
} catch (e) {}

try {
  db.exec('ALTER TABLE global_teams ADD COLUMN league_id TEXT REFERENCES leagues(id)');
} catch (e) {}
try {
  db.exec('ALTER TABLE global_teams ADD COLUMN stadium_name TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE global_teams ADD COLUMN city TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE global_teams ADD COLUMN foundation_year INTEGER');
} catch (e) {}

try {
  db.exec('ALTER TABLE global_teams ADD COLUMN stadium_image_url TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE global_teams ADD COLUMN location_map_url TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE global_players ADD COLUMN avatar_url TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE global_players ADD COLUMN is_starting INTEGER DEFAULT 0');
} catch (e) {}

console.log('--- Database initialized (UTF-8) at', dbPath);

export default db;
