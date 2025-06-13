const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'), (err) => {
    if (err) console.error('Database opening error:', err);
});

// Create user table
db.serialize(() => {
    db.run(`
   CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role_id INTEGER,
  FOREIGN KEY (role_id) REFERENCES roles(id)
)

  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS role_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      policy_id TEXT NOT NULL,
      UNIQUE(role_id, policy_id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

    db.run(`
CREATE TABLE IF NOT EXISTS user_attributes (
  user_id INTEGER PRIMARY KEY,
  region TEXT,
  department TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

    
`)


    db.run(`
    CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  rules_json TEXT NOT NULL,      -- serialized JSON array of rules
  created_at TEXT NOT NULL,      -- ISO datetime
  updated_at TEXT NOT NULL
);


    
`)


    db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      key TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT DEFAULT ''
    )
  `);


});



module.exports = db;
