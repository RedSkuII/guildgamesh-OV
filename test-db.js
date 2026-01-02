// Database connectivity test
const Database = require('better-sqlite3');
const db = new Database('./local-test.db');

console.log('\n=== DATABASE CONNECTIVITY TEST ===\n');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables found:', tables.map(t => t.name));

// Count records in key tables
const counts = {
  guilds: db.prepare('SELECT COUNT(*) as count FROM guilds').get().count,
  resources: db.prepare('SELECT COUNT(*) as count FROM resources').get().count,
  users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
  resource_history: db.prepare('SELECT COUNT(*) as count FROM resource_history').get().count,
  leaderboard: db.prepare('SELECT COUNT(*) as count FROM leaderboard').get().count,
  discord_orders: db.prepare('SELECT COUNT(*) as count FROM discord_orders').get().count,
  bot_configurations: db.prepare('SELECT COUNT(*) as count FROM bot_configurations').get().count,
};

console.log('\nRecord counts:');
for (const [table, count] of Object.entries(counts)) {
  console.log(`  ${table}: ${count}`);
}

// Test write operation
console.log('\n=== TESTING WRITE OPERATION ===\n');
try {
  const testId = 'test-' + Date.now();
  db.prepare(`
    INSERT INTO users (id, discord_id, username, created_at, last_login)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, '123456789', 'TestUser', Math.floor(Date.now()/1000), Math.floor(Date.now()/1000));
  console.log('✅ Write test passed - inserted test user');
  
  // Clean up test data
  db.prepare('DELETE FROM users WHERE id = ?').run(testId);
  console.log('✅ Cleanup passed - deleted test user');
} catch (err) {
  console.log('❌ Write test failed:', err.message);
}

// Show schema for guilds table
console.log('\n=== GUILDS TABLE SCHEMA ===\n');
const guildSchema = db.prepare("PRAGMA table_info(guilds)").all();
guildSchema.forEach(col => {
  console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
});

db.close();
console.log('\n=== DATABASE TEST COMPLETE ===\n');
