const Database = require('better-sqlite3');
const db = new Database('local-test.db');

// Create all tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT,
  custom_nickname TEXT,
  created_at INTEGER NOT NULL,
  last_login INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  roles TEXT NOT NULL,
  is_in_guild INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,
  discord_guild_id TEXT NOT NULL,
  title TEXT NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 32,
  leader_id TEXT,
  guild_access_roles TEXT,
  guild_officer_roles TEXT,
  default_role_id TEXT,
  discord_role_id TEXT,
  discord_officer_role_id TEXT,
  discord_leader_role_id TEXT,
  discord_category_id TEXT,
  discord_order_channel_id TEXT,
  bot_channel_id TEXT,
  order_channel_id TEXT,
  admin_role_id TEXT,
  auto_update_embeds INTEGER NOT NULL DEFAULT 1,
  notify_on_website_changes INTEGER NOT NULL DEFAULT 1,
  order_fulfillment_bonus INTEGER NOT NULL DEFAULT 50,
  website_bonus_percentage INTEGER NOT NULL DEFAULT 0,
  allow_public_orders INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  guild_id TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  icon TEXT,
  image_url TEXT,
  status TEXT,
  target_quantity INTEGER,
  multiplier REAL NOT NULL DEFAULT 1.0,
  last_updated_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS resource_history (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  guild_id TEXT,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  guild_id TEXT,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  action_type TEXT NOT NULL,
  quantity_changed INTEGER NOT NULL,
  base_points REAL NOT NULL,
  resource_multiplier REAL NOT NULL,
  status_bonus REAL NOT NULL,
  final_points REAL NOT NULL,
  resource_name TEXT NOT NULL,
  resource_category TEXT NOT NULL,
  resource_status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS discord_orders (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  resource_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  fulfilled_by TEXT,
  fulfilled_at INTEGER,
  created_at INTEGER NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS resource_discord_mapping (
  id TEXT PRIMARY KEY,
  discord_item_name TEXT NOT NULL,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  guild_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS discord_embeds (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  embed_type TEXT NOT NULL,
  last_updated INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS website_changes (
  id TEXT PRIMARY KEY,
  change_type TEXT NOT NULL,
  resource_id TEXT,
  order_id TEXT,
  previous_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  processed_by_bot INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bot_configurations (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL UNIQUE,
  guild_name TEXT,
  in_game_guild_id TEXT,
  bot_channel_id TEXT,
  order_channel_id TEXT,
  admin_role_id TEXT,
  auto_update_embeds INTEGER NOT NULL DEFAULT 1,
  notify_on_website_changes INTEGER NOT NULL DEFAULT 1,
  order_fulfillment_bonus INTEGER NOT NULL DEFAULT 50,
  website_bonus_percentage INTEGER NOT NULL DEFAULT 0,
  allow_public_orders INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_activity_logs (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  username TEXT,
  resource_id TEXT,
  resource_name TEXT,
  quantity INTEGER,
  points_awarded REAL,
  details TEXT,
  created_at INTEGER NOT NULL
);
`);

console.log('✅ All database tables created successfully!');
console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name).join(', '));
db.close();
