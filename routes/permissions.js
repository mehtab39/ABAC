// routes/permissions.js
const express = require('express');
const db = require('../database/db');
const router = express.Router();


// Create a permission
router.post('/', (req, res) => {
  const { entity, action, description = '' } = req.body;

  if (!entity || !action) {
    return res.status(400).json({ error: 'Entity and action required' });
  }

  const key = `${entity}.${action}`;

  const stmt = `
    INSERT INTO permissions (key, entity, action, description)
    VALUES (?, ?, ?, ?)
  `;

  db.run(stmt, [key, entity, action, description], function (err) {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not create permission' });
    }
    res.status(201).json({ key });
  });
});

// List all permissions
router.get('/', (req, res) => {
  db.all('SELECT * FROM permissions', [], (err, rows) => {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not fetch permissions' });
    }
    res.status(200).json(rows);
  });
});

// Get a permission by key
router.get('/:key', (req, res) => {
  const { key } = req.params;

  db.get('SELECT * FROM permissions WHERE key = ?', [key], (err, row) => {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not fetch permission' });
    }
    if (!row) return res.status(404).json({ error: 'Permission not found' });
    res.status(200).json(row);
  });
});

// Update a permission by key
router.put('/:key', (req, res) => {
  const { key } = req.params;
  const { description } = req.body;

  if (typeof description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' });
  }

  const stmt = `
    UPDATE permissions
    SET description = ?
    WHERE key = ?
  `;

  db.run(stmt, [description, key], function (err) {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not update permission' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Permission not found' });

    res.status(200).json({ message: 'Permission updated' });
  });
});

// Delete a permission by key
router.delete('/:key', (req, res) => {
  const { key } = req.params;

  db.run('DELETE FROM permissions WHERE key = ?', [key], function (err) {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not delete permission' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Permission not found' });

    res.status(200).json({ message: 'Permission deleted' });
  });
});

module.exports = router;
