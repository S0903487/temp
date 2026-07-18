const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'influenceos.db'));

console.log('--- USERS ---');
console.log(db.prepare('SELECT id, organization_id, name, email, role, is_frozen FROM users').all());

console.log('--- CLIENTS ---');
console.log(db.prepare('SELECT * FROM clients').all());

console.log('--- INFLUENCERS ---');
console.log(db.prepare('SELECT id, full_name, organization_id, created_at FROM influencers').all());
