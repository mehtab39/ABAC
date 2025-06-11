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

});



module.exports = db;
