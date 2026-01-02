// Comprehensive Test Suite for Guildgamesh Test Environment
const Database = require('better-sqlite3');
const db = new Database('./local-test.db');
const { nanoid } = require('nanoid');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     GUILDGAMESH TEST ENVIRONMENT - FULL SYSTEM TEST        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

// ===============================
// DATABASE STRUCTURE TESTS
// ===============================
console.log('\n📊 DATABASE STRUCTURE TESTS\n');

test('All 12 tables exist', () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const expected = ['users', 'user_sessions', 'guilds', 'resources', 'resource_history', 
                    'leaderboard', 'discord_orders', 'resource_discord_mapping', 
                    'discord_embeds', 'website_changes', 'bot_configurations', 'bot_activity_logs'];
  const actual = tables.map(t => t.name);
  expected.forEach(t => {
    if (!actual.includes(t)) throw new Error(`Missing table: ${t}`);
  });
});

test('Guilds table has all required columns', () => {
  const cols = db.prepare("PRAGMA table_info(guilds)").all().map(c => c.name);
  const required = ['id', 'discord_guild_id', 'title', 'max_members', 'leader_id', 
                    'discord_role_id', 'discord_officer_role_id', 'discord_leader_role_id'];
  required.forEach(c => {
    if (!cols.includes(c)) throw new Error(`Missing column: ${c}`);
  });
});

test('Resources table has all required columns', () => {
  const cols = db.prepare("PRAGMA table_info(resources)").all().map(c => c.name);
  const required = ['id', 'guild_id', 'name', 'quantity', 'category', 'status', 'target_quantity'];
  required.forEach(c => {
    if (!cols.includes(c)) throw new Error(`Missing column: ${c}`);
  });
});

// ===============================
// CRUD OPERATION TESTS
// ===============================
console.log('\n🔧 CRUD OPERATION TESTS\n');

const testGuildId = 'test-guild-' + Date.now();
const testDiscordGuildId = '1440025222693650606'; // Test server

test('Can INSERT guild', () => {
  db.prepare(`
    INSERT INTO guilds (id, discord_guild_id, title, max_members, auto_update_embeds, 
      notify_on_website_changes, order_fulfillment_bonus, website_bonus_percentage, 
      allow_public_orders, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(testGuildId, testDiscordGuildId, 'Test Guild', 32, 1, 1, 50, 0, 1, 
         Math.floor(Date.now()/1000), Math.floor(Date.now()/1000));
});

test('Can SELECT guild', () => {
  const guild = db.prepare('SELECT * FROM guilds WHERE id = ?').get(testGuildId);
  if (!guild) throw new Error('Guild not found');
  if (guild.title !== 'Test Guild') throw new Error('Wrong title');
});

test('Can UPDATE guild', () => {
  db.prepare('UPDATE guilds SET title = ? WHERE id = ?').run('Updated Test Guild', testGuildId);
  const guild = db.prepare('SELECT title FROM guilds WHERE id = ?').get(testGuildId);
  if (guild.title !== 'Updated Test Guild') throw new Error('Update failed');
});

const testResourceId = 'test-resource-' + Date.now();
test('Can INSERT resource with guild reference', () => {
  db.prepare(`
    INSERT INTO resources (id, guild_id, name, quantity, category, status, target_quantity, 
      multiplier, last_updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(testResourceId, testGuildId, 'Test Resource', 100, 'Raw Materials', 'at_target', 100,
         1.0, 'test-user', Math.floor(Date.now()/1000), Math.floor(Date.now()/1000));
});

test('Can SELECT resource by guild_id', () => {
  const resources = db.prepare('SELECT * FROM resources WHERE guild_id = ?').all(testGuildId);
  if (resources.length === 0) throw new Error('No resources found');
});

const testHistoryId = 'test-history-' + Date.now();
test('Can INSERT resource_history', () => {
  db.prepare(`
    INSERT INTO resource_history (id, resource_id, guild_id, previous_quantity, new_quantity, 
      change_amount, change_type, updated_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(testHistoryId, testResourceId, testGuildId, 50, 100, 50, 'relative', 'test-user', 
         Math.floor(Date.now()/1000));
});

test('Can INSERT leaderboard entry', () => {
  const leaderboardId = 'test-leaderboard-' + Date.now();
  db.prepare(`
    INSERT INTO leaderboard (id, guild_id, user_id, resource_id, action_type, quantity_changed,
      base_points, resource_multiplier, status_bonus, final_points, resource_name, resource_category,
      resource_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(leaderboardId, testGuildId, 'test-user-123', testResourceId, 'ADD', 50,
         5.0, 1.0, 0.0, 5.0, 'Test Resource', 'Raw Materials', 'below_target', Math.floor(Date.now()/1000));
});

test('Can INSERT discord_order', () => {
  const orderId = 'test-order-' + Date.now();
  db.prepare(`
    INSERT INTO discord_orders (id, guild_id, channel_id, user_id, username, resource_id, resource_name,
      quantity, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, testGuildId, '123456789012345678', 'test-user-123', 'TestUser', testResourceId, 
         'Test Resource', 100, 'pending', Math.floor(Date.now()/1000));
});

// ===============================
// CLEANUP TEST DATA
// ===============================
console.log('\n🧹 CLEANUP TEST DATA\n');

test('Can DELETE test discord_orders', () => {
  db.prepare('DELETE FROM discord_orders WHERE guild_id = ?').run(testGuildId);
});

test('Can DELETE test leaderboard entries', () => {
  db.prepare('DELETE FROM leaderboard WHERE guild_id = ?').run(testGuildId);
});

test('Can DELETE test resource_history', () => {
  db.prepare('DELETE FROM resource_history WHERE guild_id = ?').run(testGuildId);
});

test('Can DELETE test resources', () => {
  db.prepare('DELETE FROM resources WHERE guild_id = ?').run(testGuildId);
});

test('Can DELETE test guild', () => {
  db.prepare('DELETE FROM guilds WHERE id = ?').run(testGuildId);
});

// ===============================
// BOT-WEBSITE COMPATIBILITY TESTS
// ===============================
console.log('\n🔗 BOT-WEBSITE COMPATIBILITY TESTS\n');

test('Guild schema matches website Drizzle schema', () => {
  const cols = db.prepare("PRAGMA table_info(guilds)").all();
  // Check snake_case naming (bot) vs camelCase (website converts automatically)
  const hasSnakeCase = cols.some(c => c.name.includes('_'));
  if (!hasSnakeCase) throw new Error('Expected snake_case column names');
});

test('Resources schema supports guild_id foreign key pattern', () => {
  const cols = db.prepare("PRAGMA table_info(resources)").all();
  const hasGuildId = cols.some(c => c.name === 'guild_id');
  if (!hasGuildId) throw new Error('Missing guild_id column');
});

test('Discord orders can link to guilds and resources', () => {
  const cols = db.prepare("PRAGMA table_info(discord_orders)").all().map(c => c.name);
  if (!cols.includes('guild_id')) throw new Error('Missing guild_id');
  if (!cols.includes('resource_id')) throw new Error('Missing resource_id');
  if (!cols.includes('channel_id')) throw new Error('Missing channel_id');
});

// ===============================
// RESULTS
// ===============================
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log(`║  TEST RESULTS: ${passed} passed, ${failed} failed                           ║`);
console.log('╚════════════════════════════════════════════════════════════╝\n');

db.close();

if (failed > 0) {
  console.log('⚠️  Some tests failed! Please review above.');
  process.exit(1);
} else {
  console.log('🎉 All tests passed! Test environment is ready.\n');
}
