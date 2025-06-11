const express = require('express');
const db = require('../database/db');
const router = express.Router();

router.post('/', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  const stmt = db.prepare('INSERT INTO roles (name) VALUES (?)');
  stmt.run(name, function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Role already exists' });
      }
      return res.status(500).json({ error: 'Failed to create role' });
    }

    res.status(201).json({ id: this.lastID });
  });
});


module.exports = router;




